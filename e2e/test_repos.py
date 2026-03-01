"""
E2E tests for the 5 monitored repos.

Uses the scraper's saved report (reports/latest.json) as the data source.
This avoids doubling API calls and hitting rate limits.
If no report exists, tests fetch live but skip on rate-limit errors.
"""

import json
import os

import requests
import pytest
from bs4 import BeautifulSoup

from scraper.config import REPOS, GITHUB_API

REPORT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "reports", "latest.json")


@pytest.fixture(scope="session")
def report():
    """Load the scraper's report. If unavailable, fetch live."""
    if os.path.exists(REPORT_PATH):
        with open(REPORT_PATH) as f:
            return json.load(f)
    return None


@pytest.fixture(scope="session")
def repo_data(report):
    """Get per-repo GitHub metadata from the report, or fetch live."""
    if report and "repos" in report:
        data = {}
        for name, rdata in report["repos"].items():
            meta = rdata.get("github_meta", {})
            if meta.get("status") == "ok":
                data[name] = {"status_code": 200, "json": meta}
            else:
                data[name] = {
                    "status_code": meta.get("http_code"),
                    "json": None,
                }
        return data

    # Fallback: fetch live
    data = {}
    for repo in REPOS:
        url = f"{GITHUB_API}/repos/{repo['owner']}/{repo['name']}"
        try:
            resp = requests.get(url, timeout=15, headers={"Accept": "application/vnd.github.v3+json"})
            data[repo["name"]] = {
                "status_code": resp.status_code,
                "json": resp.json() if resp.status_code == 200 else None,
            }
        except requests.RequestException as e:
            data[repo["name"]] = {"status_code": None, "json": None, "error": str(e)}
    return data


def _skip_if_rate_limited(data_entry):
    """Skip test if the data shows a rate-limit error."""
    code = data_entry.get("status_code")
    if code in (403, 429, None):
        pytest.skip(f"Rate limited or unreachable (HTTP {code})")


class TestRepoExistence:
    """Verify all 5 repos exist and are accessible."""

    @pytest.mark.parametrize("repo", REPOS, ids=[r["name"] for r in REPOS])
    def test_repo_reachable(self, repo, repo_data):
        d = repo_data.get(repo["name"], {})
        _skip_if_rate_limited(d)
        assert d["status_code"] == 200, (
            f"{repo['full_name']} returned HTTP {d['status_code']}"
        )

    @pytest.mark.parametrize("repo", REPOS, ids=[r["name"] for r in REPOS])
    def test_repo_not_archived(self, repo, repo_data):
        d = repo_data.get(repo["name"], {})
        if d.get("json") is None:
            pytest.skip(f"Could not fetch {repo['name']}")
        assert d["json"].get("archived") is not True, (
            f"{repo['full_name']} is archived"
        )


class TestRepoHealth:
    """Validate repo health signals."""

    @pytest.mark.parametrize("repo", REPOS, ids=[r["name"] for r in REPOS])
    def test_has_description(self, repo, repo_data):
        d = repo_data.get(repo["name"], {})
        if d.get("json") is None:
            pytest.skip(f"Could not fetch {repo['name']}")
        desc = d["json"].get("description")
        assert desc and len(desc) > 5, (
            f"{repo['full_name']} has no meaningful description"
        )

    @pytest.mark.parametrize("repo", REPOS, ids=[r["name"] for r in REPOS])
    def test_has_license(self, repo, repo_data):
        d = repo_data.get(repo["name"], {})
        if d.get("json") is None:
            pytest.skip(f"Could not fetch {repo['name']}")
        license_info = d["json"].get("license")
        assert license_info is not None, (
            f"{repo['full_name']} has no license"
        )

    @pytest.mark.parametrize("repo", REPOS, ids=[r["name"] for r in REPOS])
    def test_has_default_branch(self, repo, repo_data):
        d = repo_data.get(repo["name"], {})
        if d.get("json") is None:
            pytest.skip(f"Could not fetch {repo['name']}")
        branch = d["json"].get("default_branch")
        assert branch in ("main", "master"), (
            f"{repo['full_name']} default branch is '{branch}', expected main or master"
        )


class TestSEOFromReport:
    """Check SEO signals from the scraper report (no extra HTTP calls)."""

    @pytest.mark.parametrize("repo", REPOS, ids=[r["name"] for r in REPOS])
    def test_has_page_title(self, repo, report):
        if report is None:
            pytest.skip("No report available")
        rdata = report["repos"].get(repo["name"], {})
        seo = rdata.get("seo_signals", {})
        if seo.get("status") != "ok":
            pytest.skip(f"SEO scrape failed for {repo['name']}")
        assert seo.get("page_title"), f"{repo['name']} has no page title"

    @pytest.mark.parametrize("repo", REPOS, ids=[r["name"] for r in REPOS])
    def test_has_og_tags(self, repo, report):
        if report is None:
            pytest.skip("No report available")
        rdata = report["repos"].get(repo["name"], {})
        seo = rdata.get("seo_signals", {})
        if seo.get("status") != "ok":
            pytest.skip(f"SEO scrape failed for {repo['name']}")
        assert seo.get("og_title") or seo.get("og_description"), (
            f"{repo['name']} missing og:title and og:description"
        )

    @pytest.mark.parametrize("repo", REPOS, ids=[r["name"] for r in REPOS])
    def test_readme_exists(self, repo, report):
        if report is None:
            pytest.skip("No report available")
        rdata = report["repos"].get(repo["name"], {})
        seo = rdata.get("seo_signals", {})
        if seo.get("status") != "ok":
            pytest.skip(f"SEO scrape failed for {repo['name']}")
        readme_len = seo.get("readme_char_count", 0)
        assert readme_len > 0, f"{repo['name']} has no README content"


class TestCommitActivity:
    """Verify repos have recent activity using report data."""

    @pytest.mark.parametrize("repo", REPOS, ids=[r["name"] for r in REPOS])
    def test_has_commits(self, repo, report):
        if report is None:
            pytest.skip("No report available")
        rdata = report["repos"].get(repo["name"], {})
        activity = rdata.get("commit_activity", {})
        if activity.get("status") != "ok":
            pytest.skip(f"Commit data unavailable for {repo['name']}")
        assert activity.get("recent_commit_count", 0) > 0, (
            f"{repo['full_name']} has no commits"
        )
