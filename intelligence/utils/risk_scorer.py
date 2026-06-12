from typing import List, Tuple

def calculate_username_risk(found_count: int, total_checked: int, has_public_email: bool, github_data: dict = None) -> Tuple[int, List[str]]:
    score = 0
    factors = []

    if found_count >= 12:
        score += 40
        factors.append(f"Username found on {found_count} platforms — very high digital exposure")
    elif found_count >= 8:
        score += 30
        factors.append(f"Username found on {found_count} platforms — high digital exposure")
    elif found_count >= 5:
        score += 20
        factors.append(f"Username found on {found_count} platforms — moderate exposure")
    elif found_count >= 2:
        score += 10
        factors.append("Username found on multiple platforms")

    if has_public_email:
        score += 25
        factors.append("Public email address exposed on GitHub profile")

    if github_data:
        followers = github_data.get("followers", 0)
        repos = github_data.get("repos", 0)

        if followers >= 100000:
            score += 25
            factors.append(f"Extremely high-profile account — {followers:,} GitHub followers")
        elif followers >= 10000:
            score += 15
            factors.append(f"High-profile account — {followers:,} GitHub followers")
        elif followers >= 1000:
            score += 8
            factors.append(f"Notable account — {followers:,} GitHub followers")

        if repos >= 100:
            score += 10
            factors.append(f"{repos} public repositories — large public codebase exposed")
        elif repos >= 20:
            score += 5

    return min(score, 100), factors

def calculate_domain_risk(
    domain_age_days: int,
    has_ssl: bool,
    ssl_expiring_soon: bool,
    privacy_protected: bool,
    subdomain_count: int,
    expiring_soon: bool
) -> Tuple[int, List[str]]:
    score = 0
    factors = []

    if domain_age_days is not None and domain_age_days < 365:
        score += 30
        factors.append(f"Domain is only {domain_age_days} days old — newly registered domains carry higher risk")

    if not has_ssl:
        score += 25
        factors.append("No SSL certificate detected — unencrypted connections")
    elif ssl_expiring_soon:
        score += 15
        factors.append("SSL certificate expiring within 30 days")

    if expiring_soon:
        score += 20
        factors.append("Domain registration expiring soon — possible lapse risk")

    if privacy_protected:
        score += 10
        factors.append("WHOIS privacy enabled — registrant identity is concealed")

    if subdomain_count > 20:
        score += 10
        factors.append(f"{subdomain_count} subdomains discovered — large attack surface")

    return min(score, 100), factors


def calculate_ip_risk(abuse_score: int, is_hosting: bool, is_proxy: bool, total_reports: int) -> Tuple[int, List[str]]:
    score = 0
    factors = []

    if abuse_score > 80:
        score += 60
        factors.append(f"AbuseIPDB confidence score is {abuse_score}% — high threat indicator")
    elif abuse_score > 50:
        score += 40
        factors.append(f"AbuseIPDB confidence score is {abuse_score}% — moderate threat")
    elif abuse_score > 20:
        score += 20
        factors.append(f"AbuseIPDB reports activity ({abuse_score}% confidence)")

    if total_reports > 100:
        score += 20
        factors.append(f"IP has {total_reports} abuse reports on record")
    elif total_reports > 10:
        score += 10
        factors.append(f"IP has {total_reports} abuse reports")

    if is_proxy:
        score += 15
        factors.append("IP identified as proxy or VPN endpoint")

    if is_hosting:
        score += 5
        factors.append("IP belongs to a hosting or datacenter provider")

    return min(score, 100), factors
