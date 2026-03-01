"""
Report Generator — produces markdown from verified scraped data.

Rule: every number in the output MUST come from the scraped data dict.
If a field is missing, the row says "not available" instead of guessing.
"""

from datetime import datetime, timezone


def _val(scraped: dict, key: str, fmt: str = "{}") -> str:
    """Return formatted value or 'n/a' — never a guess."""
    v = scraped.get(key)
    if v is None:
        return "n/a"
    return fmt.format(v)


def repo_row(scraped: dict) -> str:
    """One markdown table row for a scraped repo."""
    name = f"{scraped.get('owner', '?')}/{scraped.get('repo', '?')}"
    return (
        f"| {name} "
        f"| {_val(scraped, 'stars')} "
        f"| {_val(scraped, 'forks')} "
        f"| {_val(scraped, 'open_issues_count')} "
        f"| {_val(scraped, 'open_prs')} "
        f"| {_val(scraped, 'language')} "
        f"| {_val(scraped, 'branches_count')} "
        f"| {scraped.get('_scraped_at', 'n/a')[:19]}Z |"
    )


def seo_row(scored: dict) -> str:
    """One markdown table row for SEO score."""
    name = f"{scored.get('owner', '?')}/{scored.get('repo', '?')}"
    score = scored.get("seo_score", "n/a")
    signals = scored.get("signals", {})
    top_gap = ""
    if signals:
        worst = min(signals, key=lambda k: signals[k])
        top_gap = f"{worst} ({signals[worst]})"
    return f"| {name} | {score} | {top_gap} |"


def generate_readme_section(scraped_repos: list[dict], seo_scores: list[dict]) -> str:
    """
    Generate the verified-data section for README.
    Every number here was fetched in this run.
    """
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    lines = [
        "## Verified Repo Data",
        "",
        f"> Last scraped: **{now}**",
        "> Every number below was fetched live from the GitHub API during this run.",
        "> Fields that failed to fetch show `n/a` — never backfilled from old data.",
        "",
        "### Repository Stats",
        "",
        "| Repo | Stars | Forks | Open Issues | Open PRs | Language | Branches | Scraped At |",
        "|------|-------|-------|-------------|----------|----------|----------|------------|",
    ]
    for r in scraped_repos:
        lines.append(repo_row(r))

    lines += [
        "",
        "### SEO Discoverability Scores",
        "",
        "| Repo | Score | Weakest Signal |",
        "|------|-------|----------------|",
    ]
    for s in seo_scores:
        lines.append(seo_row(s))

    lines += [
        "",
        "### SEO Recommendations",
        "",
    ]
    for s in seo_scores:
        recs = s.get("recommendations", [])
        if recs:
            lines.append(f"**{s.get('owner')}/{s.get('repo')}**")
            for rec in recs:
                lines.append(f"- {rec}")
            lines.append("")

    return "\n".join(lines)
