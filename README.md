# operator

**Canonical control repo for the BlackRoad OS platform.**

All automation, configuration, and infrastructure definitions originate here.
No automation runs against any org or repo unless it is declared in this repo first.

---

## What's Working (verified 2026-03-04)

Every item below was tested end-to-end. No number is assumed or cached.

### Test Results

| Suite | Runner | Passed | Skipped | Failed |
|-------|--------|--------|---------|--------|
| Python unit tests (`tests/`) | pytest | 25 | 0 | 0 |
| Python E2E tests (`e2e/`) | pytest | 37 | 17 | 0 |
| JS unit — scraper (`tests/unit/scraper.test.js`) | node:test | 8 | 0 | 0 |
| JS unit — verify (`tests/unit/verify.test.js`) | node:test | 7 | 0 | 0 |
| JS unit — SEO (`tests/unit/seo.test.js`) | node:test | 9 | 0 | 0 |
| JS E2E — pipeline (`tests/e2e/pipeline.test.js`) | node:test | 11 | 0 | 0 |
| JS unit — dashboard (`tests/dashboard.test.js`) | node:test | 10 | 0 | 0 |
| **Total** | | **107** | **17** | **0** |

### Working Components

| Component | Command | Status |
|-----------|---------|--------|
| **Python scraper pipeline** | `python3 scripts/run_all.py` | Scrape + E2E + README update — all 3 stages pass |
| **GitHub scraper (Python)** | `python3 -c "from scraper.github_scraper import scrape_all; scrape_all()"` | Scrapes 5 repos via GitHub API, no stale data |
| **SEO scraper (Python)** | via `scripts/run_all.py` | Fetches GitHub meta + HTML SEO signals + commit activity |
| **SEO analyzer (Python)** | via `scripts/run_all.py` | 10-signal weighted scoring (0-100) with recommendations |
| **JS scraper** | `npm run scrape` | Scrapes 5 repos via curl with retry/backoff, writes `scraper/data/repos.json` |
| **JS readme renderer** | `npm run render` | Generates README from scraped data with provenance |
| **Infrastructure audit runner** | `npm run audit` | Checks DNS, HTTPS, SSL, GitHub org status |
| **Trust audit** | `npm run audit:trust` | Per-org health scoring with configurable thresholds |
| **SEO generator** | `src/seo/generate.js` | Builds repo graph, JSON-LD structured data, ecosystem index |
| **Data verifier** | `src/verify.js` | Validates freshness, completeness, JSON integrity |
| **E2E test runner** | `src/e2e-runner.js` | 30+ assertions with recovery steps |
| **Automation pipeline** | `src/automation.js` | Chains scrape → E2E → README → report with error recovery |
| **Status dashboard** | `src/dashboard/status.js` | Markdown + JSON status generation from E2E reports |
| **Bootstrap** | `npm run bootstrap` | Validates config files exist |
| **Inventory** | `npm run inventory` | TSV manifest + tree + summary by extension |

### TypeScript/CLI Components (require GITHUB_TOKEN)

These components are fully implemented but require a GitHub token to run:

| Component | Entry Point | What It Does |
|-----------|-------------|--------------|
| CLI (`scan`) | `src/cli.ts` | Discover orgs/repos, build manifest |
| CLI (`stream`) | `src/cli.ts` | Stream live events from orgs |
| CLI (`status`) | `src/cli.ts` | Show repo status (branches, commits) |
| CLI (`broadcast`) | `src/cli.ts` | Push files to all repos across orgs |
| CLI (`rate-limit`) | `src/cli.ts` | Check GitHub API rate limits |
| GitHub client | `src/github/client.ts` | Octokit wrapper with retry |
| Org discovery | `src/github/orgs.ts` | Auto-discover + validate orgs |
| Repo operations | `src/github/repos.ts` | CRUD on repo content, branches, commits |
| Event streaming | `src/stream/engine.ts` | Polling with cursor persistence |
| Remote sync | `src/remote/sync.ts` | Full org/repo scan + manifest |
| Remote broadcast | `src/remote/broadcast.ts` | Idempotent file push with dry-run |

### Jest Tests (require `npx jest`)

Three test files use Jest for mocking. They test the `src/scraper/github-scraper.js`, `src/seo/seo-analyzer.js`, and `src/e2e/runner.js` modules:

```bash
npm run test:jest   # requires jest installed
```

---

## Quick Start

```bash
# 1. Install dependencies
npm install
pip3 install -r requirements.txt

# 2. Validate environment
npm run bootstrap

# 3. Run the full pipeline (scrape → test → README update)
python3 scripts/run_all.py

# 4. Run all tests
npm test                  # JS tests (45 tests)
npm run test:python       # Python tests (62 passed, 17 skipped)

# 5. Run infrastructure audit
npm run audit
```

## Structure

| Directory | Purpose |
|-----------|---------|
| `config/` | Single source of truth for all configuration |
| `src/` | Core TypeScript/JavaScript implementation |
| `scraper/` | Python + JS GitHub and SEO scrapers |
| `audit/` | Infrastructure verification (DNS, HTTPS, SSL, GitHub) |
| `scripts/` | Automation entry-points (pipeline, bootstrap, inventory) |
| `tests/` | JS unit tests (node:test) + Python tests (pytest) |
| `e2e/` | Python end-to-end tests (repo health, SEO, scraper) |
| `docs/` | Architecture documentation and runbooks |
| `infra/` | Infrastructure-as-code definitions |
| `bin/` | CLI entry point |
| `public/` | Static HTML pages (map, status) |

## npm Scripts

```
npm run audit          Node.js infrastructure audit (DNS/HTTPS/SSL/GitHub)
npm run audit:trust    Trust architecture verification with health scoring
npm run scrape         Scrape 5 repos via JS scraper
npm run render         Generate README from scraped data
npm test               Run JS test suite (45 tests)
npm run test:python    Run Python test suite (79 tests)
npm run test:jest      Run Jest-based mock tests (requires jest)
npm run pipeline       Full Python pipeline (scrape + E2E + README)
npm run bootstrap      Validate local environment
npm run inventory      Generate file inventory manifest
```

## Core Rule

> All automation originates here.

- Agents do not open PRs across orgs until declared in `config/orgs.yaml`.
- Every automated mutation runs through a script in `scripts/`.
- Every infrastructure change is declared in `infra/`.

## Operational Reset

If the system feels out of control, follow the reset procedure in
`docs/runbook.md`:

1. Set `global_enabled: false` in `config/automation.yaml`.
2. Audit `config/orgs.yaml` — disable any targets that should not be touched.
3. Re-enable targets one at a time after review.

## Docs

- [Architecture](docs/architecture.md) — system design and control-flow
- [Runbook](docs/runbook.md) — day-to-day operations
- [File Organization](docs/FILE-ORGANIZATION.md) — directory structure
- [Verification Spec](docs/VERIFICATION_SPEC.md) — data verification rules
