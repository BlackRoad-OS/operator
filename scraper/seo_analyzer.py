"""
SEO Analyzer — scores repos on discoverability signals.

Google indexes repos by: title, description, topics, README h1,
homepage link, license, activity recency.  We score each signal
so you know exactly what's missing and what to fix.

Every score is computed from live scraped data — never assumed.
"""

from datetime import datetime, timezone
from typing import Optional


# Each signal scored 0-100, weighted into a composite.
SIGNAL_WEIGHTS = {
    "description":    15,   # repo description present + length
    "topics":         15,   # topic tags
    "homepage":       10,   # homepage URL set
    "license":        10,   # license identified
    "readme_exists":   5,   # has non-trivial README (inferred from size)
    "activity":       15,   # pushed in last 30 days
    "stars":          10,   # social proof
    "has_pages":       5,   # GitHub Pages deployed
    "open_issues":     5,   # community engagement signal
    "contributors":   10,   # multi-contributor signal
}


def _days_since(iso_date: Optional[str]) -> Optional[float]:
    if not iso_date:
        return None
    try:
        dt = datetime.fromisoformat(iso_date.replace("Z", "+00:00"))
        return (datetime.now(timezone.utc) - dt).total_seconds() / 86400
    except (ValueError, TypeError):
        return None


def score_repo(scraped: dict) -> dict:
    """
    Score a single scraped repo dict.  Returns signal breakdown
    and composite score.  Missing data = 0 for that signal.
    """
    signals = {}

    # description
    desc = scraped.get("description") or ""
    if len(desc) >= 50:
        signals["description"] = 100
    elif len(desc) >= 20:
        signals["description"] = 60
    elif len(desc) > 0:
        signals["description"] = 30
    else:
        signals["description"] = 0

    # topics
    topics = scraped.get("topics", [])
    if len(topics) >= 5:
        signals["topics"] = 100
    elif len(topics) >= 3:
        signals["topics"] = 70
    elif len(topics) >= 1:
        signals["topics"] = 40
    else:
        signals["topics"] = 0

    # homepage
    signals["homepage"] = 100 if scraped.get("homepage") else 0

    # license
    lic = scraped.get("license")
    signals["license"] = 100 if (lic and lic != "NOASSERTION") else 0

    # readme (inferred from repo size > 1 KB)
    signals["readme_exists"] = 100 if (scraped.get("size_kb", 0) or 0) > 1 else 0

    # activity
    days = _days_since(scraped.get("pushed_at"))
    if days is not None:
        if days <= 7:
            signals["activity"] = 100
        elif days <= 30:
            signals["activity"] = 70
        elif days <= 90:
            signals["activity"] = 40
        else:
            signals["activity"] = 10
    else:
        signals["activity"] = 0

    # stars
    stars = scraped.get("stars", 0) or 0
    if stars >= 100:
        signals["stars"] = 100
    elif stars >= 10:
        signals["stars"] = 60
    elif stars >= 1:
        signals["stars"] = 30
    else:
        signals["stars"] = 0

    # has_pages
    signals["has_pages"] = 100 if scraped.get("has_pages") else 0

    # open_issues (engagement)
    issues = scraped.get("open_issues_count", 0) or 0
    if issues >= 20:
        signals["open_issues"] = 100
    elif issues >= 5:
        signals["open_issues"] = 60
    elif issues >= 1:
        signals["open_issues"] = 30
    else:
        signals["open_issues"] = 0

    # contributors
    contribs = scraped.get("contributors_count", 0) or 0
    if contribs >= 10:
        signals["contributors"] = 100
    elif contribs >= 3:
        signals["contributors"] = 60
    elif contribs >= 2:
        signals["contributors"] = 30
    else:
        signals["contributors"] = 0

    # composite
    composite = sum(
        signals.get(k, 0) * (w / 100)
        for k, w in SIGNAL_WEIGHTS.items()
    )

    return {
        "owner": scraped.get("owner"),
        "repo": scraped.get("repo"),
        "_scraped_at": scraped.get("_scraped_at"),
        "seo_score": round(composite, 1),
        "signals": signals,
        "recommendations": _recommendations(signals, scraped),
    }


def _recommendations(signals: dict, scraped: dict) -> list[str]:
    """Generate actionable SEO recommendations based on signal gaps."""
    recs = []
    if signals.get("description", 0) < 60:
        recs.append("Add a description (50+ chars) explaining what this repo does")
    if signals.get("topics", 0) < 70:
        current = len(scraped.get("topics", []))
        recs.append(f"Add more topic tags (currently {current}, aim for 5+)")
    if signals.get("homepage", 0) == 0:
        recs.append("Set a homepage URL (docs site, landing page, etc.)")
    if signals.get("license", 0) == 0:
        recs.append("Add a recognized license so GitHub can display it")
    if signals.get("activity", 0) < 70:
        recs.append("Push recent commits — stale repos rank lower")
    if signals.get("has_pages", 0) == 0:
        recs.append("Enable GitHub Pages for additional search surface")
    return recs


def analyze_all(scraped_repos: list[dict]) -> list[dict]:
    """Score all scraped repos."""
    return [score_repo(r) for r in scraped_repos]
