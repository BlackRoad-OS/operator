"""Shared fixtures for E2E tests."""

import pytest
from scraper.github_scraper import scrape_all, TARGET_REPOS
from scraper.seo_analyzer import analyze_all


@pytest.fixture(scope="session")
def live_scraped_data():
    """Scrape all target repos once per test session (live API calls)."""
    return scrape_all()


@pytest.fixture(scope="session")
def live_seo_scores(live_scraped_data):
    """SEO scores computed from live scraped data."""
    return analyze_all(live_scraped_data)


@pytest.fixture
def target_repos():
    """The list of repos we're tracking."""
    return TARGET_REPOS
