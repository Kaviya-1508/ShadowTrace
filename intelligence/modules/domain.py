import asyncio
import ssl
import socket
from datetime import datetime, timezone
from typing import Optional
import httpx
import dns.resolver
import whois
from utils.risk_scorer import calculate_domain_risk

HEADERS = {"User-Agent": "ShadowTrace-Nexus/1.0"}


def get_whois_info(domain: str) -> dict:
    try:
        w = whois.whois(domain)
        creation   = w.creation_date
        expiration = w.expiration_date
        if isinstance(creation,   list): creation   = creation[0]
        if isinstance(expiration, list): expiration = expiration[0]

        now = datetime.now(timezone.utc)
        if creation   and creation.tzinfo   is None: creation   = creation.replace(tzinfo=timezone.utc)
        if expiration and expiration.tzinfo is None: expiration = expiration.replace(tzinfo=timezone.utc)

        age_days      = (now - creation).days if creation else None
        expiring_soon = bool(expiration and (expiration - now).days < 30)
        privacy       = bool(
            w.registrant_name and any(
                kw in str(w.registrant_name).lower()
                for kw in ["privacy", "whoisguard", "redacted", "protected", "proxy"]
            )
        )
        return {
            "registrar":      str(w.registrar) if w.registrar else None,
            "creationDate":   creation.strftime("%Y-%m-%d")   if creation   else None,
            "expirationDate": expiration.strftime("%Y-%m-%d") if expiration else None,
            "ageDays":        age_days,
            "expiringSoon":   expiring_soon,
            "privacyProtected": privacy,
            "country": w.country if isinstance(w.country, str) else (w.country[0] if w.country else None),
            "registrantName": str(w.registrant_name)[:80] if w.registrant_name and not privacy else None,
        }
    except Exception as e:
        return {"error": str(e)}


def get_dns_records(domain: str) -> dict:
    records = {"a": [], "mx": [], "ns": [], "txt": []}
    resolver = dns.resolver.Resolver()
    resolver.nameservers = ['8.8.8.8', '1.1.1.1']
    resolver.timeout  = 5
    resolver.lifetime = 5
    for rtype in ["A", "MX", "NS", "TXT"]:
        try:
            answers = resolver.resolve(domain, rtype)
            if   rtype == "A":   records["a"]   = [str(r) for r in answers]
            elif rtype == "MX":  records["mx"]  = [str(r.exchange).rstrip(".") for r in answers]
            elif rtype == "NS":  records["ns"]  = [str(r).rstrip(".") for r in answers]
            elif rtype == "TXT": records["txt"] = [b"".join(r.strings).decode("utf-8", errors="ignore") for r in answers][:5]
        except Exception:
            pass
    return records


def get_ssl_info(domain: str) -> Optional[dict]:
    try:
        ctx = ssl.create_default_context()
        with ctx.wrap_socket(socket.socket(), server_hostname=domain) as s:
            s.settimeout(8)
            s.connect((domain, 443))
            cert = s.getpeercert()
        not_after    = cert.get("notAfter")
        expiry_dt    = None
        expiring_soon = False
        if not_after:
            expiry_dt     = datetime.strptime(not_after, "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
            expiring_soon = (expiry_dt - datetime.now(timezone.utc)).days < 30
        issuer  = dict(x[0] for x in cert.get("issuer",  []))
        subject = dict(x[0] for x in cert.get("subject", []))
        return {
            "issuer":       issuer.get("organizationName") or issuer.get("commonName"),
            "subject":      subject.get("commonName"),
            "expiry":       expiry_dt.strftime("%Y-%m-%d") if expiry_dt else None,
            "expiringSoon": expiring_soon,
        }
    except Exception:
        return None


async def get_subdomains(domain: str) -> list:
    subs = set()

    # Method 1 — crt.sh (certificate transparency)
    try:
        async with httpx.AsyncClient(timeout=25) as client:
            r = await client.get(
                f"https://crt.sh/?q=%.{domain}&output=json",
                headers=HEADERS
            )
            if r.status_code == 200 and r.text.strip().startswith("["):
                for entry in r.json():
                    name_value = entry.get("name_value", "")
                    for sub in name_value.split("\n"):
                        sub = sub.strip().lstrip("*.")
                        # Only direct subdomains (one level deep) to avoid noise
                        if (sub and sub.endswith("." + domain)
                                and sub != domain
                                and sub.count(".") == domain.count(".") + 1):
                            subs.add(sub)
    except Exception:
        pass

    # Method 2 — hackertarget (fallback)
    if not subs:
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                r = await client.get(
                    f"https://api.hackertarget.com/hostsearch/?q={domain}",
                    headers=HEADERS
                )
                if r.status_code == 200 and "error" not in r.text.lower():
                    for line in r.text.strip().split("\n"):
                        if "," in line:
                            sub = line.split(",")[0].strip()
                            if sub and sub.endswith("." + domain) and sub != domain:
                                subs.add(sub)
        except Exception:
            pass

    # Method 3 — DNS brute force common prefixes (always runs as supplement)
    common = [
        "www", "mail", "ftp", "blog", "docs", "api", "dev", "staging",
        "cdn", "static", "images", "smtp", "vpn", "admin", "portal",
        "support", "status", "forum", "wiki", "app", "shop", "store",
        "help", "cloud", "test", "beta", "secure", "login", "dashboard"
    ]
    resolver = dns.resolver.Resolver()
    resolver.nameservers = ['8.8.8.8', '1.1.1.1']
    resolver.timeout  = 2
    resolver.lifetime = 2

    async def check_sub(prefix):
        sub = f"{prefix}.{domain}"
        try:
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(None, lambda: resolver.resolve(sub, "A"))
            subs.add(sub)
        except Exception:
            pass

    await asyncio.gather(*[check_sub(p) for p in common])

    # Sort, deduplicate, cap at 30 meaningful results
    result = sorted(subs)
    return result[:30]


async def scan_domain(domain: str) -> dict:
    loop = asyncio.get_running_loop()

    whois_data, dns_data, ssl_data, subdomains = await asyncio.gather(
        loop.run_in_executor(None, get_whois_info, domain),
        loop.run_in_executor(None, get_dns_records, domain),
        loop.run_in_executor(None, get_ssl_info, domain),
        get_subdomains(domain)
    )

    age_days        = whois_data.get("ageDays")
    has_ssl         = ssl_data is not None
    ssl_expiring    = ssl_data.get("expiringSoon", False) if ssl_data else False
    privacy         = whois_data.get("privacyProtected", False)
    expiring_soon   = whois_data.get("expiringSoon", False)
    subdomain_count = len(subdomains)

    risk_score, risk_factors = calculate_domain_risk(
        domain_age_days=age_days,
        has_ssl=has_ssl,
        ssl_expiring_soon=ssl_expiring,
        privacy_protected=privacy,
        subdomain_count=subdomain_count,
        expiring_soon=expiring_soon,
    )

    print(f"\n[ShadowTrace] Domain scan: {domain}")
    print(f"  WHOIS:      {'ok' if 'registrar' in whois_data else 'error'}")
    print(f"  DNS:        A={len(dns_data.get('a',[]))} MX={len(dns_data.get('mx',[]))} NS={len(dns_data.get('ns',[]))}")
    print(f"  SSL:        {'ok' if has_ssl else 'none'}")
    print(f"  Subdomains: {subdomain_count} found")
    print(f"  Risk:       {risk_score}/100\n")

    return {
        "domain":         domain,
        "whois":          whois_data,
        "dns":            dns_data,
        "ssl":            ssl_data,
        "subdomains":     subdomains,
        "subdomainCount": subdomain_count,
        "riskScore":      risk_score,
        "riskFactors":    risk_factors,
    }
