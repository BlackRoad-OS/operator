"""
README Updater — replaces the verified data section with fresh scraped data.

Only modifies the section between markers.  Never touches content above
the markers.  If markers don't exist yet, appends the section.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scraper.github_scraper import scrape_all
from scraper.seo_analyzer import analyze_all
from scraper.report import generate_readme_section

START_MARKER = "<!-- VERIFIED-DATA-START -->"
END_MARKER = "<!-- VERIFIED-DATA-END -->"


def update_readme(readme_path: str = "README.md") -> dict:
    """
    Scrape live data and update README.  Returns a summary dict
    with what changed.
    """
    # Scrape
    scraped = scrape_all()
    scores = analyze_all(scraped)
    section = generate_readme_section(scraped, scores)

    verified_block = f"{START_MARKER}\n{section}\n{END_MARKER}"

    # Read current README
    with open(readme_path, "r") as f:
        content = f.read()

    # Replace or append
    if START_MARKER in content and END_MARKER in content:
        before = content[: content.index(START_MARKER)]
        after = content[content.index(END_MARKER) + len(END_MARKER) :]
        new_content = before + verified_block + after
    else:
        new_content = content.rstrip() + "\n\n" + verified_block + "\n"

    with open(readme_path, "w") as f:
        f.write(new_content)

    return {
        "repos_scraped": len(scraped),
        "repos_api_ok": sum(1 for r in scraped if r.get("_api_ok")),
        "avg_seo_score": round(
            sum(s["seo_score"] for s in scores) / len(scores), 1
        ),
        "readme_updated": readme_path,
    }


if __name__ == "__main__":
    result = update_readme()
    print(f"Updated: {result}")
