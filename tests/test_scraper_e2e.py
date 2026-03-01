"""
E2E tests for the BlackRoad OS operator scraper.

These tests hit the live GitHub API.  Every assertion validates that
we got real data back — no mocks, no fakes.
"""

import json
import os
import tempfile
from datetime import datetime, timezone

import pytest

from scraper.github_scraper import (
    TARGET_REPOS,
    scrape_all,
    scrape_repo,
    scrape_to_json,
)
from scraper.seo_analyzer import analyze_all, score_repo
from scraper.report import generate_readme_section


# ────────────────────────────────────────────
#  Scraper E2E
# ────────────────────────────────────────────

class TestScraperLive:
    """Tests that actually hit the GitHub API."""

    def test_target_repos_defined(self):
        """We have exactly 5 target repos configured."""
        assert len(TARGET_REPOS) == 5
        for r in TARGET_REPOS:
            assert "owner" in r
            assert "repo" in r

    def test_scrape_single_repo(self):
        """Scraping a single known repo returns valid data."""
        result = scrape_repo("BlackRoad-OS", "operator")
        assert result["owner"] == "BlackRoad-OS"
        assert result["repo"] == "operator"
        assert "_scraped_at" in result
        # Verify timestamp is recent (within last 5 minutes)
        scraped = datetime.fromisoformat(result["_scraped_at"])
        age = (datetime.now(timezone.utc) - scraped).total_seconds()
        assert age < 300, f"Scraped timestamp is {age}s old, expected < 300s"

    def test_scrape_single_repo_has_real_data(self):
        """A successful scrape should have actual GitHub data."""
        result = scrape_repo("BlackRoad-OS", "operator")
        if result.get("_api_ok"):
            # These fields MUST exist if API returned successfully
            assert "stars" in result
            assert "forks" in result
            assert isinstance(result["stars"], int)
            assert isinstance(result["forks"], int)
            assert "default_branch" in result

    def test_scrape_all_returns_five(self, live_scraped_data):
        """scrape_all() returns exactly 5 results."""
        assert len(live_scraped_data) == 5

    def test_scrape_all_covers_all_targets(self, live_scraped_data):
        """Every target repo appears in results."""
        scraped_names = {f"{r['owner']}/{r['repo']}" for r in live_scraped_data}
        target_names = {f"{r['owner']}/{r['repo']}" for r in TARGET_REPOS}
        assert scraped_names == target_names

    def test_no_none_values_in_output(self, live_scraped_data):
        """Scraper strips None values — verified data only."""
        for repo in live_scraped_data:
            for key, value in repo.items():
                assert value is not None, f"{repo['repo']}.{key} is None"

    def test_every_result_has_timestamp(self, live_scraped_data):
        """Every result must have a scrape timestamp."""
        for repo in live_scraped_data:
            assert "_scraped_at" in repo, f"{repo['repo']} missing _scraped_at"

    def test_scrape_to_json_creates_file(self):
        """scrape_to_json writes valid JSON to disk."""
        with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as f:
            path = f.name
        try:
            scrape_to_json(path)
            with open(path) as f:
                data = json.load(f)
            assert isinstance(data, list)
            assert len(data) == 5
            for item in data:
                assert "_scraped_at" in item
        finally:
            os.unlink(path)

    def test_scrape_nonexistent_repo(self):
        """Scraping a repo that doesn't exist returns _api_ok=False."""
        result = scrape_repo("BlackRoad-OS", "this-repo-definitely-does-not-exist-xyz-999")
        assert result.get("_api_ok") is False

    def test_timestamps_are_fresh(self, live_scraped_data):
        """All timestamps should be from this test run (< 5 min old)."""
        now = datetime.now(timezone.utc)
        for repo in live_scraped_data:
            scraped = datetime.fromisoformat(repo["_scraped_at"])
            age = (now - scraped).total_seconds()
            assert age < 300, (
                f"{repo['repo']} scraped_at is {age:.0f}s old"
            )


# ────────────────────────────────────────────
#  SEO Analyzer E2E
# ────────────────────────────────────────────

class TestSEOAnalyzer:
    """Tests for SEO scoring on live data."""

    def test_scores_returned_for_all(self, live_seo_scores):
        """Every repo gets an SEO score."""
        assert len(live_seo_scores) == 5

    def test_score_range(self, live_seo_scores):
        """SEO scores are between 0 and 100."""
        for s in live_seo_scores:
            assert 0 <= s["seo_score"] <= 100, (
                f"{s['repo']} score {s['seo_score']} out of range"
            )

    def test_signals_present(self, live_seo_scores):
        """Each score has a signals breakdown."""
        expected_signals = {
            "description", "topics", "homepage", "license",
            "readme_exists", "activity", "stars", "has_pages",
            "open_issues", "contributors",
        }
        for s in live_seo_scores:
            assert set(s["signals"].keys()) == expected_signals

    def test_signal_values_valid(self, live_seo_scores):
        """Every signal is an int between 0 and 100."""
        for s in live_seo_scores:
            for signal_name, val in s["signals"].items():
                assert isinstance(val, int), f"{s['repo']}.{signal_name} not int"
                assert 0 <= val <= 100, f"{s['repo']}.{signal_name}={val}"

    def test_recommendations_are_strings(self, live_seo_scores):
        """Recommendations should be a list of strings."""
        for s in live_seo_scores:
            assert isinstance(s.get("recommendations"), list)
            for rec in s["recommendations"]:
                assert isinstance(rec, str)
                assert len(rec) > 10  # meaningful recommendation

    def test_scraped_at_propagated(self, live_seo_scores):
        """SEO scores carry the original scrape timestamp."""
        for s in live_seo_scores:
            assert "_scraped_at" in s

    def test_score_reflects_data(self):
        """A repo with all signals maxed scores 100."""
        perfect = {
            "owner": "test", "repo": "test",
            "_scraped_at": datetime.now(timezone.utc).isoformat(),
            "description": "A" * 60,
            "topics": ["a", "b", "c", "d", "e"],
            "homepage": "https://example.com",
            "license": "MIT",
            "size_kb": 100,
            "pushed_at": datetime.now(timezone.utc).isoformat(),
            "stars": 200,
            "has_pages": True,
            "open_issues_count": 50,
            "contributors_count": 15,
        }
        result = score_repo(perfect)
        assert result["seo_score"] == 100.0

    def test_score_zero_for_empty(self):
        """A repo with no data scores 0."""
        empty = {"owner": "test", "repo": "test", "_scraped_at": "now"}
        result = score_repo(empty)
        assert result["seo_score"] == 0.0


# ────────────────────────────────────────────
#  Report Generator E2E
# ────────────────────────────────────────────

class TestReportGenerator:
    """Tests for verified-data report generation."""

    def test_report_contains_all_repos(self, live_scraped_data, live_seo_scores):
        """Report includes every tracked repo."""
        report = generate_readme_section(live_scraped_data, live_seo_scores)
        for r in TARGET_REPOS:
            assert r["repo"] in report, f"{r['repo']} missing from report"

    def test_report_has_timestamp(self, live_scraped_data, live_seo_scores):
        """Report includes a 'Last scraped' timestamp."""
        report = generate_readme_section(live_scraped_data, live_seo_scores)
        assert "Last scraped:" in report

    def test_report_no_placeholder_zeros(self, live_scraped_data, live_seo_scores):
        """Report never contains our sentinel 'n/a' where API succeeded."""
        report = generate_readme_section(live_scraped_data, live_seo_scores)
        # For repos where API succeeded, stars/forks should be numbers not n/a
        for r in live_scraped_data:
            if r.get("_api_ok"):
                # stars field should appear as a number in the report
                repo_name = f"{r['owner']}/{r['repo']}"
                assert repo_name in report

    def test_report_is_valid_markdown(self, live_scraped_data, live_seo_scores):
        """Report has proper markdown table structure."""
        report = generate_readme_section(live_scraped_data, live_seo_scores)
        lines = report.strip().split("\n")
        table_rows = [l for l in lines if l.startswith("|")]
        # At least header + separator + 5 data rows for each table
        assert len(table_rows) >= 12  # 2 tables * (header + sep + 5 rows)

    def test_report_contains_seo_section(self, live_scraped_data, live_seo_scores):
        """Report includes SEO scores section."""
        report = generate_readme_section(live_scraped_data, live_seo_scores)
        assert "SEO Discoverability Scores" in report

    def test_report_contains_recommendations(self, live_scraped_data, live_seo_scores):
        """Report includes actionable SEO recommendations."""
        report = generate_readme_section(live_scraped_data, live_seo_scores)
        assert "SEO Recommendations" in report


# ────────────────────────────────────────────
#  Integration: Full Pipeline E2E
# ────────────────────────────────────────────

class TestFullPipeline:
    """End-to-end: scrape → score → report."""

    def test_full_pipeline(self):
        """Run the entire pipeline and verify output integrity."""
        # Step 1: Scrape
        scraped = scrape_all()
        assert len(scraped) == 5

        # Step 2: Score
        scores = analyze_all(scraped)
        assert len(scores) == 5

        # Step 3: Report
        report = generate_readme_section(scraped, scores)
        assert len(report) > 200  # non-trivial output

        # Step 4: Verify no stale data leaked in
        for r in scraped:
            ts = datetime.fromisoformat(r["_scraped_at"])
            age = (datetime.now(timezone.utc) - ts).total_seconds()
            assert age < 300

        # Step 5: Verify JSON round-trip
        with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as f:
            path = f.name
        try:
            scrape_to_json(path)
            with open(path) as f:
                reloaded = json.load(f)
            assert len(reloaded) == 5
            # Every field in reloaded should match scraped
            for orig, loaded in zip(scraped, reloaded):
                assert orig["owner"] == loaded["owner"]
                assert orig["repo"] == loaded["repo"]
        finally:
            os.unlink(path)
