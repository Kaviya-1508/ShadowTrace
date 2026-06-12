import asyncio
import os
import httpx
from utils.risk_scorer import calculate_username_risk

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")

API_HEADERS = {
    "User-Agent": "ShadowTrace-Nexus/1.0",
    "Accept": "application/json",
}

BROWSER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
}

# (name, check_url, mode, profile_url)
PLATFORMS = [
    ("github",        "https://api.github.com/users/{u}",                                                  "api",    "https://github.com/{u}"),
    ("reddit",        "https://www.reddit.com/user/{u}/about.json",                                        "reddit", "https://reddit.com/u/{u}"),
    ("devto",         "https://dev.to/api/users/by_username?url={u}",                                      "json",   "https://dev.to/{u}"),
    ("medium",        "https://medium.com/@{u}",                                                            "json",   "https://medium.com/@{u}"),
    ("stackoverflow", "https://api.stackexchange.com/2.3/users?inname={u}&site=stackoverflow&pagesize=5",  "so",     "https://stackoverflow.com/search?q={u}"),
    ("gitlab",        "https://gitlab.com/{u}",                                                             "head",   "https://gitlab.com/{u}"),
    ("kaggle",        "https://www.kaggle.com/{u}",                                                        "head",   "https://www.kaggle.com/{u}"),
    ("hackerrank",    "https://www.hackerrank.com/{u}",                                                    "head",   "https://www.hackerrank.com/{u}"),
    ("leetcode",      "https://leetcode.com/{u}/",                                                         "head",   "https://leetcode.com/{u}/"),
    ("twitch",        "https://www.twitch.tv/{u}",                                                         "head",   "https://www.twitch.tv/{u}"),
    ("pinterest",     "https://www.pinterest.com/{u}/",                                                    "head",   "https://www.pinterest.com/{u}/"),
    ("pypi",          "https://pypi.org/user/{u}/",                                                        "head",   "https://pypi.org/user/{u}/"),
    ("npm",           "https://www.npmjs.com/~{u}",                                                        "head",   "https://www.npmjs.com/~{u}"),
    ("hashnode",      "https://hashnode.com/@{u}",                                                         "head",   "https://hashnode.com/@{u}"),
    ("codepen",       "https://codepen.io/{u}",                                                            "head",   "https://codepen.io/{u}"),
    ("replit",        "https://replit.com/@{u}",                                                           "head",   "https://replit.com/@{u}"),
    ("dockerhub",     "https://hub.docker.com/u/{u}/",                                                     "head",   "https://hub.docker.com/u/{u}/"),
    ("bitbucket",     "https://bitbucket.org/{u}/",                                                        "head",   "https://bitbucket.org/{u}/"),
    ("producthunt",   "https://www.producthunt.com/@{u}",                                                  "head",   "https://www.producthunt.com/@{u}"),
    ("youtube",       "https://www.youtube.com/@{u}",                                                      "head",   "https://www.youtube.com/@{u}"),
]

NOT_FOUND_SIGNALS = [
    "login", "signin", "sign-in", "signup", "sign-up",
    "404", "not-found", "notfound", "/error", "/home",
    "register", "auth", "accounts.google", "challenge",
    "explore", "discover", "trending", "feed",
    "join", "welcome", "start", "onboarding",
    "search", "browse", "directory",
]

PLATFORM_NOT_FOUND = {
    "twitch":      ["twitch.tv/directory", "twitch.tv/p/", "twitch.tv/?"],
    "pinterest":   ["pinterest.com/search", "pinterest.com/login"],
    "kaggle":      ["kaggle.com/account", "kaggle.com/explore"],
    "hackerrank":  ["hackerrank.com/dashboard", "hackerrank.com/auth"],
    "hashnode":    ["hashnode.com/explore", "hashnode.com/onboard"],
    "pypi":        ["pypi.org/search", "pypi.org/account"],
    "dockerhub":   ["hub.docker.com/search", "hub.docker.com/login"],
    "replit":      ["replit.com/login", "replit.com/~"],
    "codepen":     ["codepen.io/login", "codepen.io/trending"],
    "youtube":     ["youtube.com/results", "youtube.com/?"],
    "gitlab":      ["gitlab.com/users/sign_in", "gitlab.com/explore"],
    "bitbucket":   ["bitbucket.org/account", "bitbucket.org/dashboard"],
    "leetcode":    ["leetcode.com/problemset", "leetcode.com/auth"],
    "npm":         ["npmjs.com/login", "npmjs.com/search"],
    "producthunt": ["producthunt.com/login", "producthunt.com/topics"],
}


async def check_platform(
    client: httpx.AsyncClient,
    username: str,
    name: str,
    url_tpl: str,
    mode: str,
    profile_url_tpl: str
) -> dict:
    url         = url_tpl.replace("{u}", username)
    profile_url = profile_url_tpl.replace("{u}", username)
    base = {
        "platform": name,
        "found":    False,
        "url":      profile_url,
        "data":     {}
    }

    try:
        # ── GitHub API ──────────────────────────────────────────────
        if mode == "api":
            headers = {**API_HEADERS}
            if GITHUB_TOKEN:
                headers["Authorization"] = f"token {GITHUB_TOKEN}"
            r = await client.get(url, headers=headers, timeout=10)
            if r.status_code == 200:
                d = r.json()
                return {**base, "found": True, "data": {
                    "repos":     d.get("public_repos", 0),
                    "followers": d.get("followers", 0),
                    "following": d.get("following", 0),
                    "created":   d.get("created_at"),
                    "bio":       d.get("bio"),
                    "location":  d.get("location"),
                    "email":     d.get("email"),
                    "name":      d.get("name"),
                    "blog":      d.get("blog"),
                }}

        # ── Reddit ──────────────────────────────────────────────────
        elif mode == "reddit":
            for attempt in range(2):
                try:
                    r = await client.get(url, headers={
                        **API_HEADERS,
                        "User-Agent": f"Mozilla/5.0 ShadowTrace Research attempt={attempt}"
                    }, timeout=12)
                    if r.status_code == 200:
                        data = r.json().get("data", {})
                        if data.get("name"):
                            return {**base, "found": True, "data": {
                                "karma":    data.get("total_karma", 0),
                                "created":  data.get("created_utc"),
                                "verified": data.get("verified", False),
                            }}
                        break
                    elif r.status_code == 429:
                        await asyncio.sleep(2)
                        continue
                    else:
                        break
                except Exception:
                    break

        # ── Generic JSON APIs (Dev.to, Medium) ──────────────────────
        elif mode == "json":
            r = await client.get(url, headers=BROWSER_HEADERS, timeout=10, follow_redirects=True)
            if r.status_code == 200:
                final_url  = str(r.url).lower()
                redirected = any(s in final_url for s in NOT_FOUND_SIGNALS)
                if not redirected:
                    if name == "devto":
                        try:
                            d = r.json()
                            if d.get("username") or d.get("name"):
                                return {**base, "found": True, "data": {
                                    "name":     d.get("name"),
                                    "location": d.get("location"),
                                    "joined":   d.get("joined_at"),
                                }}
                        except Exception:
                            pass
                    else:
                        return {**base, "found": True}

        # ── Stack Overflow API ───────────────────────────────────────
        elif mode == "so":
            r = await client.get(url, headers=API_HEADERS, timeout=10)
            if r.status_code == 200:
                items = r.json().get("items", [])
                exact = [
                    u for u in items
                    if u.get("display_name", "").lower() == username.lower()
                ]
                if not exact:
                    exact = [
                        u for u in items
                        if username.lower() in u.get("link", "").lower()
                    ]
                if exact:
                    return {**base,
                        "found": True,
                        "url":   exact[0].get("link", profile_url),
                        "data":  {
                            "reputation": exact[0].get("reputation", 0),
                            "badges":     exact[0].get("badge_counts", {}),
                            "location":   exact[0].get("location"),
                        }
                    }

        # ── HEAD / GET profile page checks ──────────────────────────
        elif mode == "head":
            r = await client.get(
                url, headers=BROWSER_HEADERS,
                timeout=10, follow_redirects=True
            )
            final_url = str(r.url).lower()

            # Step 1 — generic not-found signals in URL
            redirected = any(s in final_url for s in NOT_FOUND_SIGNALS)

            # Step 2 — platform-specific not-found URL patterns
            if not redirected and name in PLATFORM_NOT_FOUND:
                redirected = any(
                    pattern in final_url
                    for pattern in PLATFORM_NOT_FOUND[name]
                )

            # Step 3 — username must appear in final URL or page body
            # Catches platforms that return 200 but redirect to homepage
            if not redirected and r.status_code == 200:
                username_lower = username.lower()
                username_in_url = username_lower in final_url

                if not username_in_url:
                    # Fall back to checking page body
                    try:
                        body = r.text.lower()
                        if username_lower not in body:
                            redirected = True
                    except Exception:
                        redirected = True

            if r.status_code == 200 and not redirected:
                return {**base, "found": True}

    except httpx.TimeoutException:
        return {**base, "error": "timeout"}
    except Exception as e:
        return {**base, "error": str(e)[:60]}

    return base


async def scan_username(username: str) -> dict:
    limits = httpx.Limits(max_connections=15, max_keepalive_connections=10)

    async with httpx.AsyncClient(limits=limits, follow_redirects=True) as client:
        tasks = [
            check_platform(client, username, name, url_tpl, mode, profile_url)
            for name, url_tpl, mode, profile_url in PLATFORMS
        ]
        results = await asyncio.gather(*tasks, return_exceptions=False)

    # Debug output visible in Python terminal
    print(f"\n[ShadowTrace] Username scan: {username}")
    print(f"{'─' * 40}")
    for r in results:
        status = "✓ FOUND    " if r["found"] else "✗ not found"
        error  = f"  [err: {r.get('error')}]" if r.get("error") else ""
        print(f"  [{r['platform']:15}] {status}{error}")
    print(f"{'─' * 40}\n")

    found_count   = sum(1 for r in results if r["found"])
    total_checked = len(PLATFORMS)

    github = next((r for r in results if r["platform"] == "github" and r["found"]), None)
    has_public_email = bool(github and github.get("data", {}).get("email"))
    github_data      = github.get("data", {}) if github else {}

    risk_score, risk_factors = calculate_username_risk(
        found_count, total_checked, has_public_email, github_data
    )

    return {
        "username":     username,
        "platforms":    list(results),
        "foundCount":   found_count,
        "totalChecked": total_checked,
        "riskScore":    risk_score,
        "riskFactors":  risk_factors,
    }