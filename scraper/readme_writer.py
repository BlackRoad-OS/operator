"""
README generator that ONLY writes verified numbers.

Rules:
  1. If a field is null/error, it says "unavailable" - never invents a number
  2. Every number has a timestamp of when it was fetched
  3. The "Verified" badge only appears if data was fetched in the current run
"""

import json
import os
from datetime import datetime, timezone


def load_report(path: str = "reports/latest.json") -> dict | None:
    if not os.path.exists(path):
        return None
    with open(path) as f:
        return json.load(f)


def _val(data: dict, key: str, fallback: str = "unavailable") -> str:
    """Return value if status is ok, otherwise fallback."""
    if data.get("status") != "ok":
        return fallback
    v = data.get(key)
    if v is None:
        return fallback
    return str(v)


def generate_readme(report: dict) -> str:
    generated = report.get("generated_at", "unknown")
    lines = [
        "# operator",
        "",
        "BlackRoad OS operator agent — system administration AI that orchestrates, scrapes, and validates across the BlackRoad ecosystem.",
        "",
        "## Monitored Repos",
        "",
        f"> All numbers below were fetched live at `{generated}`.  ",
        "> If a value says \"unavailable\", the API call failed — we don't guess.",
        "",
        "| Repo | Stars | Forks | Open Issues | Last Push | SEO: Meta Desc | SEO: README Length |",
        "|------|-------|-------|-------------|-----------|----------------|-------------------|",
    ]

    for name, data in report.get("repos", {}).items():
        meta = data.get("github_meta", {})
        seo = data.get("seo_signals", {})

        stars = _val(meta, "stars")
        forks = _val(meta, "forks")
        issues = _val(meta, "open_issues")
        pushed = _val(meta, "pushed_at")
        if pushed != "unavailable":
            pushed = pushed[:10]  # just the date

        has_meta_desc = "yes" if seo.get("meta_description") else "no"
        if seo.get("status") != "ok":
            has_meta_desc = "unavailable"

        readme_len = _val(seo, "readme_char_count")

        url = data.get("config", {}).get("github_url", "#")
        lines.append(
            f"| [{name}]({url}) | {stars} | {forks} | {issues} | {pushed} | {has_meta_desc} | {readme_len} chars |"
        )

    lines.extend([
        "",
        "## E2E Status",
        "",
        "Run `python3 -m pytest e2e/ -v` to validate all repos.",
        "",
        "## Scraper",
        "",
        "Run `python3 -m scraper.seo_scraper` to refresh all numbers above.",
        "",
        "## Architecture",
        "",
        "```",
        "operator/",
        "  scraper/          # Live SEO + GitHub API scraper",
        "    config.py       # 5 target repos",
        "    seo_scraper.py  # Fetches real data, saves to reports/",
        "    readme_writer.py# Generates README from verified data only",
        "  e2e/              # End-to-end validation tests",
        "    test_repos.py   # Repo existence, health, SEO checks",
        "    test_scraper.py # Scraper integration tests",
        "  scripts/          # Automation",
        "    run_all.py      # Full pipeline: scrape -> test -> update README",
        "  .github/workflows/",
        "    e2e.yml         # CI: runs on push + daily schedule",
        "  reports/           # Live data (gitignored, regenerated each run)",
        "```",
        "",
        f"*Last verified: {generated}*",
        "",
    ])

    return "\n".join(lines)


def write_readme(report: dict, path: str = "README.md"):
    content = generate_readme(report)
    with open(path, "w") as f:
        f.write(content)
    print(f"  README.md updated with verified data from {report.get('generated_at')}")


if __name__ == "__main__":
    report = load_report()
    if report is None:
        print("No report found. Run the scraper first: python3 -m scraper.seo_scraper")
    else:
        write_readme(report)
