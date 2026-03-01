"""
GitHub Scraper — fetches live data from the GitHub API.

Every number returned has a `_scraped_at` timestamp proving when it was
verified.  Nothing is cached across runs; if a request fails the field
is omitted rather than backfilled with stale data.
"""

import json
import os
import urllib.request
import urllib.error
from datetime import datetime, timezone
from typing import Optional


# The 5 repos this operator instance tracks.
TARGET_REPOS: list[dict[str, str]] = [
    {"owner": "BlackRoad-OS", "repo": "blackroad"},
    {"owner": "BlackRoad-OS", "repo": "blackroad-os"},
    {"owner": "BlackRoad-OS", "repo": ".github"},
    {"owner": "BlackRoad-OS", "repo": "blackroad-os-web"},
    {"owner": "BlackRoad-OS", "repo": "operator"},
]

API_BASE = "https://api.github.com"


def _headers() -> dict[str, str]:
    """Build request headers, including auth token if available."""
    h = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "BlackRoad-OS-Operator-Scraper/1.0",
    }
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if token:
        h["Authorization"] = f"Bearer {token}"
    return h


def _get_json(url: str) -> Optional[dict]:
    """GET a URL and return parsed JSON, or None on failure."""
    req = urllib.request.Request(url, headers=_headers())
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except (urllib.error.URLError, urllib.error.HTTPError, OSError, json.JSONDecodeError):
        return None


def _link_header_last_page(url: str) -> Optional[int]:
    """Fetch HEAD/GET with per_page=1 and parse Link header for last page count."""
    req = urllib.request.Request(f"{url}?per_page=1&state=all", headers=_headers())
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            link = resp.headers.get("Link", "")
            for part in link.split(","):
                if 'rel="last"' in part:
                    # <https://...?per_page=1&page=42>; rel="last"
                    page_str = part.split("page=")[-1].split(">")[0]
                    return int(page_str)
    except (urllib.error.URLError, urllib.error.HTTPError, OSError, ValueError):
        pass
    return None


def scrape_repo(owner: str, repo: str) -> dict:
    """
    Scrape a single repo.  Returns only fields we actually got back
    from the API right now — never fills in from old data.
    """
    now = datetime.now(timezone.utc).isoformat()
    result: dict = {
        "owner": owner,
        "repo": repo,
        "_scraped_at": now,
    }

    # ── core repo metadata ──
    data = _get_json(f"{API_BASE}/repos/{owner}/{repo}")
    if data and isinstance(data, dict):
        result["stars"] = data.get("stargazers_count")
        result["forks"] = data.get("forks_count")
        result["open_issues_count"] = data.get("open_issues_count")
        result["language"] = data.get("language")
        result["default_branch"] = data.get("default_branch")
        result["description"] = data.get("description")
        result["homepage"] = data.get("homepage")
        result["topics"] = data.get("topics", [])
        result["license"] = (data.get("license") or {}).get("spdx_id")
        result["created_at"] = data.get("created_at")
        result["updated_at"] = data.get("updated_at")
        result["pushed_at"] = data.get("pushed_at")
        result["size_kb"] = data.get("size")
        result["archived"] = data.get("archived")
        result["has_wiki"] = data.get("has_wiki")
        result["has_pages"] = data.get("has_pages")
        result["visibility"] = data.get("visibility")
        result["_api_ok"] = True
    else:
        result["_api_ok"] = False

    # ── contributors count ──
    contribs = _get_json(f"{API_BASE}/repos/{owner}/{repo}/contributors?per_page=1&anon=true")
    if isinstance(contribs, list):
        # Use link header for real count
        count = _link_header_last_page(f"{API_BASE}/repos/{owner}/{repo}/contributors")
        result["contributors_count"] = count if count else len(contribs)

    # ── open PRs count (separate from issues) ──
    prs = _get_json(f"{API_BASE}/repos/{owner}/{repo}/pulls?state=open&per_page=1")
    if isinstance(prs, list):
        pr_count = _link_header_last_page(f"{API_BASE}/repos/{owner}/{repo}/pulls")
        result["open_prs"] = pr_count if pr_count else len(prs)

    # ── branches count ──
    branches = _get_json(f"{API_BASE}/repos/{owner}/{repo}/branches?per_page=1")
    if isinstance(branches, list):
        br_count = _link_header_last_page(f"{API_BASE}/repos/{owner}/{repo}/branches")
        result["branches_count"] = br_count if br_count else len(branches)

    # ── latest release ──
    release = _get_json(f"{API_BASE}/repos/{owner}/{repo}/releases/latest")
    if release and isinstance(release, dict) and "tag_name" in release:
        result["latest_release"] = release["tag_name"]
        result["latest_release_date"] = release.get("published_at")

    # Strip None values — if we didn't get it, don't report it
    return {k: v for k, v in result.items() if v is not None}


def scrape_all() -> list[dict]:
    """Scrape all target repos. Returns list of verified results."""
    return [scrape_repo(r["owner"], r["repo"]) for r in TARGET_REPOS]


def scrape_to_json(output_path: str = "scraped_data.json") -> str:
    """Scrape all repos and write results to JSON file. Returns the path."""
    results = scrape_all()
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)
    return output_path


if __name__ == "__main__":
    print(json.dumps(scrape_all(), indent=2))
