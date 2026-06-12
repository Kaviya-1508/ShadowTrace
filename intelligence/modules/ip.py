import asyncio
import os
import re
import httpx
from utils.risk_scorer import calculate_ip_risk

ABUSEIPDB_KEY = os.getenv("ABUSEIPDB_API_KEY", "")
HEADERS = {"User-Agent": "ShadowTrace-Nexus/1.0"}

# FIX: IP validation regex (IPv4 and IPv6)
IPV4_RE = re.compile(
    r'^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$'
)
IPV6_RE = re.compile(r'^[0-9a-fA-F:]+$')


def is_valid_ip(ip: str) -> bool:
    return bool(IPV4_RE.match(ip)) or bool(IPV6_RE.match(ip) and ':' in ip)


async def get_geo(client: httpx.AsyncClient, ip: str) -> dict:
    """ip-api.com — free, no key, 45 req/min."""
    try:
        r = await client.get(
            f"http://ip-api.com/json/{ip}?fields=66846719",
            headers=HEADERS,
            timeout=10
        )
        if r.status_code == 200:
            d = r.json()
            if d.get("status") == "success":
                return {
                    "country": d.get("country"),
                    "countryCode": d.get("countryCode"),
                    "regionName": d.get("regionName"),
                    "city": d.get("city"),
                    "zip": d.get("zip"),
                    "lat": d.get("lat"),
                    "lon": d.get("lon"),
                    "timezone": d.get("timezone"),
                    "isp": d.get("isp"),
                    "org": d.get("org"),
                    "as": d.get("as"),
                    "hosting": d.get("hosting", False),
                    "proxy": d.get("proxy", False),
                    "mobile": d.get("mobile", False)
                }
    except Exception:
        pass
    return {}


async def get_abuse(client: httpx.AsyncClient, ip: str) -> dict:
    """AbuseIPDB — free tier 1000 checks/day. Requires API key."""
    if not ABUSEIPDB_KEY:
        return {"note": "AbuseIPDB key not configured — set ABUSEIPDB_API_KEY in intelligence/.env"}

    try:
        r = await client.get(
            "https://api.abuseipdb.com/api/v2/check",
            params={"ipAddress": ip, "maxAgeInDays": 90},
            headers={
                **HEADERS,
                "Key": ABUSEIPDB_KEY,
                "Accept": "application/json"
            },
            timeout=10
        )
        if r.status_code == 200:
            d = r.json().get("data", {})
            return {
                "abuseConfidenceScore": d.get("abuseConfidenceScore", 0),
                "totalReports": d.get("totalReports", 0),
                "lastReportedAt": d.get("lastReportedAt"),
                "usageType": d.get("usageType"),
                "isTor": d.get("isTor", False),
                "countryCode": d.get("countryCode")
            }
    except Exception:
        pass
    return {"abuseConfidenceScore": 0, "totalReports": 0}


async def scan_ip(ip: str) -> dict:
    # FIX: validate IP format before making external requests
    if not is_valid_ip(ip):
        return {
            "ip": ip,
            "geo": {},
            "abuse": {},
            "riskScore": 0,
            "riskFactors": ["Invalid IP address format"]
        }

    async with httpx.AsyncClient() as client:
        geo, abuse = await asyncio.gather(
            get_geo(client, ip),
            get_abuse(client, ip)
        )

    is_hosting = geo.get("hosting", False)
    is_proxy = geo.get("proxy", False)
    abuse_score = abuse.get("abuseConfidenceScore", 0)
    total_reports = abuse.get("totalReports", 0)

    risk_score, risk_factors = calculate_ip_risk(
        abuse_score=abuse_score,
        is_hosting=is_hosting,
        is_proxy=is_proxy,
        total_reports=total_reports
    )

    return {
        "ip": ip,
        "geo": geo,
        "abuse": abuse,
        "riskScore": risk_score,
        "riskFactors": risk_factors
    }
