"""
Integration tests for the scraper itself.
Uses the saved report to minimize API calls. Falls back to live with rate-limit awareness.
"""

import json
import os
import pytest

from scraper.seo_scraper import (
    fetch_github_meta,
    fetch_seo_signals,
    fetch_commit_activity,
)
from scraper.config import REPOS

REPORT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "reports", "latest.json")


@pytest.fixture(scope="session")
def report():
    """Load existing report to avoid redundant API calls."""
    if os.path.exists(REPORT_PATH):
        with open(REPORT_PATH) as f:
            return json.load(f)
    return None


class TestGitHubMetaFetcher:

    def test_fetch_known_repo(self, report):
        if report:
            meta = report["repos"].get("operator", {}).get("github_meta", {})
            if meta.get("status") == "ok":
                assert isinstance(meta["stars"], int)
                assert meta["fetched_at"] is not None
                return
        result = fetch_github_meta("BlackRoad-OS", "operator")
        if result["status"] == "error" and result.get("http_code") in (403, 429):
            pytest.skip("Rate limited")
        assert result["status"] == "ok", f"Failed to fetch operator: {result}"
        assert isinstance(result["stars"], int)

    def test_fetch_nonexistent_repo(self):
        result = fetch_github_meta("BlackRoad-OS", "this-repo-does-not-exist-xyz-999")
        assert result["status"] == "error"
        assert result["fetched_at"] is not None


class TestSEOSignalsFetcher:

    def test_scrape_github_page(self, report):
        if report:
            seo = report["repos"].get("operator", {}).get("seo_signals", {})
            if seo.get("status") == "ok":
                assert seo["page_title"] is not None
                assert isinstance(seo["h1_count"], int)
                return
        result = fetch_seo_signals("https://github.com/BlackRoad-OS/operator")
        assert result["status"] == "ok", f"Failed: {result}"
        assert result["page_title"] is not None

    def test_scrape_bad_url(self):
        result = fetch_seo_signals("https://github.com/BlackRoad-OS/nope-nope-nope-404")
        assert result["status"] == "error"


class TestCommitActivityFetcher:

    def test_fetch_commits(self, report):
        if report:
            activity = report["repos"].get("operator", {}).get("commit_activity", {})
            if activity.get("status") == "ok":
                assert activity["recent_commit_count"] > 0
                assert activity["latest_commit_date"] is not None
                return
        result = fetch_commit_activity("BlackRoad-OS", "operator")
        if result["status"] == "error" and result.get("http_code") in (403, 429):
            pytest.skip("Rate limited")
        assert result["status"] == "ok"
        assert result["recent_commit_count"] > 0


class TestReportStructure:

    def test_report_has_all_repos(self, report):
        if report is None:
            pytest.skip("No report available")
        assert len(report["repos"]) == len(REPOS)
        for repo in REPOS:
            assert repo["name"] in report["repos"]

    def test_every_repo_has_three_sections(self, report):
        if report is None:
            pytest.skip("No report available")
        for name, data in report["repos"].items():
            assert "github_meta" in data, f"{name} missing github_meta"
            assert "seo_signals" in data, f"{name} missing seo_signals"
            assert "commit_activity" in data, f"{name} missing commit_activity"

    def test_every_data_point_has_timestamp(self, report):
        if report is None:
            pytest.skip("No report available")
        for name, data in report["repos"].items():
            assert "fetched_at" in data["github_meta"], f"{name} github_meta missing timestamp"
            assert "fetched_at" in data["seo_signals"], f"{name} seo_signals missing timestamp"
            assert "fetched_at" in data["commit_activity"], f"{name} commit_activity missing timestamp"


class TestNoStaleData:
    """The cardinal rule: no stale data, no invented numbers."""

    def test_error_repos_have_no_fake_numbers(self):
        result = fetch_github_meta("BlackRoad-OS", "fake-repo-that-does-not-exist")
        assert result["status"] == "error"
        assert "stars" not in result
        assert "forks" not in result
