# operator

E2E scraper and validation system for BlackRoad OS repositories.

## What It Does

Scrapes, validates, and reports real metrics across target repos. Every number is verified at runtime - nothing cached, nothing assumed.

- **Scraper** - GitHub API scraper with retry logic, pulls repo stats, commits, workflows, CI runs, PRs
- **SEO Analyzer** - Live page analysis: title, meta, OG tags, headings, structured data, link audit
- **E2E Runner** - Orchestrates scraper + SEO across all targets, runs health checks
- **Dashboard** - Generates status output from verified data only

## Setup

```bash
npm install
```

## Commands

```bash
npm test          # Run 41 unit tests
npm run e2e       # Run full E2E scraper against all targets
npm run status    # Display latest verified status
```

## Targets

Configured in `config/targets.json`. Currently validates 5 repos across the BlackRoad org universe.

## CI/CD

- **Tests** run on every push and PR
- **E2E scraper** runs every 6 hours via GitHub Actions, commits verified STATUS.md

## Architecture

```
src/
  scraper/         GitHub API scraper (repos, commits, workflows, runs, PRs)
  seo/             Live SEO page analyzer (title, meta, OG, headings, schema)
  e2e/             E2E runner + CLI entry point
  dashboard/       Status report generator (markdown + JSON)
config/
  targets.json     Target repos for scraping
tests/             Jest unit tests (41 tests, 4 suites)
reports/           Generated reports (gitignored, latest.json)
```
