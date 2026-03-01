"""
SEO scraper for BlackRoad-OS repos.

Collects LIVE data only. Every number in the output was fetched right now.
If a fetch fails, the field is null - never a stale fallback.
"""

import json
import os
import sys
import time
from datetime import datetime, timezone
from typing import Any

import requests
from bs4 import BeautifulSoup

from scraper.config import GITHUB_API, REPOS, REPORT_DIR, REPORT_FILE


def _ts() -> str:
    return datetime.now(timezone.utc).isoformat()


def fetch_github_meta(owner: str, name: str) -> dict[str, Any]:
    """Fetch repo metadata from GitHub API. Returns live data or nulls."""
    url = f"{GITHUB_API}/repos/{owner}/{name}"
    try:
        resp = requests.get(url, timeout=15, headers={"Accept": "application/vnd.github.v3+json"})
        if resp.status_code == 200:
            d = resp.json()
            return {
                "stars": d.get("stargazers_count"),
                "forks": d.get("forks_count"),
                "open_issues": d.get("open_issues_count"),
                "watchers": d.get("subscribers_count"),
                "size_kb": d.get("size"),
                "default_branch": d.get("default_branch"),
                "updated_at": d.get("updated_at"),
                "pushed_at": d.get("pushed_at"),
                "topics": d.get("topics", []),
                "license": (d.get("license") or {}).get("spdx_id"),
                "has_pages": d.get("has_pages"),
                "archived": d.get("archived"),
                "language": d.get("language"),
                "description": d.get("description"),
                "homepage": d.get("homepage"),
                "fetched_at": _ts(),
                "status": "ok",
            }
        return {"status": "error", "http_code": resp.status_code, "fetched_at": _ts()}
    except requests.RequestException as e:
        return {"status": "error", "error": str(e), "fetched_at": _ts()}


def fetch_seo_signals(github_url: str) -> dict[str, Any]:
    """Scrape the GitHub repo page for SEO-relevant signals."""
    try:
        resp = requests.get(github_url, timeout=15, headers={"User-Agent": "BlackRoad-Operator-SEO/1.0"})
        if resp.status_code != 200:
            return {"status": "error", "http_code": resp.status_code, "fetched_at": _ts()}

        soup = BeautifulSoup(resp.text, "html.parser")

        # Extract meta tags
        meta_desc = None
        meta_tag = soup.find("meta", attrs={"name": "description"})
        if meta_tag:
            meta_desc = meta_tag.get("content")

        og_title = None
        og_tag = soup.find("meta", attrs={"property": "og:title"})
        if og_tag:
            og_title = og_tag.get("content")

        og_desc = None
        og_desc_tag = soup.find("meta", attrs={"property": "og:description"})
        if og_desc_tag:
            og_desc = og_desc_tag.get("content")

        og_image = None
        og_img_tag = soup.find("meta", attrs={"property": "og:image"})
        if og_img_tag:
            og_image = og_img_tag.get("content")

        canonical = None
        canon_tag = soup.find("link", attrs={"rel": "canonical"})
        if canon_tag:
            canonical = canon_tag.get("href")

        title_tag = soup.find("title")
        page_title = title_tag.string.strip() if title_tag and title_tag.string else None

        # Count headings
        h1_count = len(soup.find_all("h1"))
        h2_count = len(soup.find_all("h2"))

        # Count links
        internal_links = 0
        external_links = 0
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if href.startswith("http") and "github.com" not in href:
                external_links += 1
            else:
                internal_links += 1

        # README length (proxy for content depth)
        readme_article = soup.find("article", class_="markdown-body")
        readme_length = len(readme_article.get_text()) if readme_article else 0

        return {
            "page_title": page_title,
            "meta_description": meta_desc,
            "og_title": og_title,
            "og_description": og_desc,
            "og_image": og_image,
            "canonical_url": canonical,
            "h1_count": h1_count,
            "h2_count": h2_count,
            "internal_links": internal_links,
            "external_links": external_links,
            "readme_char_count": readme_length,
            "fetched_at": _ts(),
            "status": "ok",
        }
    except requests.RequestException as e:
        return {"status": "error", "error": str(e), "fetched_at": _ts()}


def fetch_commit_activity(owner: str, name: str) -> dict[str, Any]:
    """Fetch recent commit activity - a real signal of repo health."""
    url = f"{GITHUB_API}/repos/{owner}/{name}/commits?per_page=5"
    try:
        resp = requests.get(url, timeout=15, headers={"Accept": "application/vnd.github.v3+json"})
        if resp.status_code == 200:
            commits = resp.json()
            return {
                "recent_commit_count": len(commits),
                "latest_commit_date": commits[0]["commit"]["committer"]["date"] if commits else None,
                "latest_commit_message": commits[0]["commit"]["message"].split("\n")[0] if commits else None,
                "fetched_at": _ts(),
                "status": "ok",
            }
        return {"status": "error", "http_code": resp.status_code, "fetched_at": _ts()}
    except requests.RequestException as e:
        return {"status": "error", "error": str(e), "fetched_at": _ts()}


def scrape_all() -> dict[str, Any]:
    """Run full scrape across all 5 repos. Returns structured report."""
    report = {
        "generated_at": _ts(),
        "generator": "BlackRoad Operator SEO Scraper v1",
        "repos": {},
    }

    for repo in REPOS:
        name = repo["name"]
        owner = repo["owner"]
        print(f"  Scraping {owner}/{name}...", flush=True)

        meta = fetch_github_meta(owner, name)
        seo = fetch_seo_signals(repo["github_url"])
        activity = fetch_commit_activity(owner, name)

        report["repos"][name] = {
            "config": repo,
            "github_meta": meta,
            "seo_signals": seo,
            "commit_activity": activity,
        }

    report["completed_at"] = _ts()
    return report


def save_report(report: dict[str, Any]) -> str:
    """Save report to disk. Returns path."""
    os.makedirs(REPORT_DIR, exist_ok=True)
    path = os.path.join(REPORT_DIR, REPORT_FILE)
    with open(path, "w") as f:
        json.dump(report, f, indent=2)
    return path


def main():
    print(f"[{_ts()}] Starting SEO scrape of {len(REPOS)} repos...")
    report = scrape_all()

    # Summary
    ok_count = sum(
        1 for r in report["repos"].values()
        if r["github_meta"].get("status") == "ok"
    )
    print(f"\n  Results: {ok_count}/{len(REPOS)} repos scraped successfully")

    path = save_report(report)
    print(f"  Report saved: {path}")
    print(f"[{report['completed_at']}] Done.")
    return report


if __name__ == "__main__":
    main()
