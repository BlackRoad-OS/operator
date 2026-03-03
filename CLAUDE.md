# CLAUDE.md — AI Assistant Guide for `operator`

## Project Overview

**operator** is the canonical control repo for the [BlackRoad OS](https://blackroad.io) platform, owned by BlackRoad OS, Inc. (Delaware C-Corp, founded by Alexa Louise Amundson). It serves as the single source of truth for all automation, configuration, infrastructure auditing, scraping, and E2E testing across the BlackRoad GitHub ecosystem.

This is **proprietary software** — NOT open source. Do not add open-source license headers, SPDX identifiers, or any licensing that conflicts with the existing proprietary license in `LICENSE`.

## Repository Structure

```
operator/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md              # Bug report template
│   │   └── feature_request.md         # Feature request template
│   ├── PULL_REQUEST_TEMPLATE.md       # PR template with BlackRoad OS checklist
│   └── workflows/
│       ├── audit.yml                  # Infrastructure audit (daily + push/PR)
│       ├── ci.yml                     # Repo structure validation (push/PR)
│       ├── e2e-scrape.yml             # Scraper + verification pipeline (6-hourly)
│       ├── e2e-scraper.yml            # Enhanced scraper with retry/recovery (6-hourly)
│       ├── e2e-tests.yml              # Python E2E tests (push/PR/6-hourly)
│       ├── e2e.yml                    # Unified pipeline: scrape+test+readme (daily)
│       └── tests.yml                  # Node.js unit tests with coverage (push/PR)
├── audit/
│   ├── checks/
│   │   ├── dns.js                     # DNS resolution check
│   │   ├── github.js                  # GitHub org existence check
│   │   ├── https.js                   # HTTPS reachability check
│   │   └── ssl.js                     # SSL certificate validity check
│   ├── run.js                         # Trust-architecture audit runner
│   └── runner.js                      # Infrastructure audit runner (main entry)
├── bin/
│   └── operator.js                    # CLI entry point (imports dist/cli.js)
├── config/
│   ├── automation.yaml                # Cross-org automation settings + kill-switch
│   ├── blackroad.json                 # Enterprise orgs and domains registry
│   ├── orgs.yaml                      # Org/repo registry (automation targets)
│   ├── targets.json                   # E2E scraper target repos (5 repos)
│   └── README.md                      # Config directory documentation
├── data/                              # Scraped data output (JSON files)
├── docs/
│   ├── architecture.md                # System design and control-flow
│   ├── FILE-ORGANIZATION.md           # Strategy for organizing 100k+ file repos
│   ├── runbook.md                     # Day-to-day operations guide
│   ├── VERIFICATION_SPEC.md           # Infrastructure verification spec v1.0.0
│   └── README.md                      # Docs navigation index
├── e2e/                               # E2E test suites (Python + JS)
├── e2e-tests/                         # E2E test reports
├── functions/
│   └── api.js                         # Cloudflare Pages function (GitHub API proxy)
├── infrastructure/
│   ├── audit.sh                       # Shell-based infrastructure health check
│   └── config.json                    # 17 orgs + 11 domains to monitor
├── public/                            # Static web assets (HTML/CSS/JS)
├── reports/                           # Generated audit/E2E reports
├── scraper/                           # Python scraper package
│   ├── config.py                      # Target repos and paths
│   ├── github_scraper.py              # GitHub API scraper (stdlib only)
│   ├── readme_writer.py               # README generator from verified data
│   ├── report.py                      # Markdown report generator
│   ├── seo_analyzer.py                # SEO scoring (10 signals, 0-100)
│   ├── seo_scraper.py                 # SEO signal scraper (requests + bs4)
│   ├── update_readme.py               # README updater with verified-data markers
│   ├── index.js                       # Node.js scraper (curl backend)
│   ├── render-readme.js               # Node.js README renderer
│   └── repos.json                     # Scraper target config
├── scripts/
│   ├── bootstrap.sh                   # Environment validation
│   ├── categorize.sh                  # File categorization by extension/path
│   ├── deduplicate.sh                 # SHA-256 duplicate detection
│   ├── inventory.sh                   # Filesystem inventory generator
│   ├── rollback.sh                    # Reverse file moves from audit log
│   ├── run_all.py                     # Full pipeline orchestrator
│   └── README.md                      # Scripts documentation
├── src/
│   ├── index.ts                       # TypeScript library exports (streaming engine)
│   ├── index.js                       # JS scraper main entry
│   ├── cli.ts                         # CLI: scan, stream, status, broadcast, rate-limit
│   ├── config.ts                      # Config loader (.env, env vars)
│   ├── config.js                      # JS scraper config (5 repos)
│   ├── automation.js                  # Full automation pipeline orchestrator
│   ├── readme-updater.js              # README updater (verified data only)
│   ├── scraper.js                     # Scraper entry point
│   ├── verify.js                      # Data verification gate
│   ├── e2e-runner.js                  # E2E pipeline orchestrator
│   ├── github/                        # GitHub API client layer (TypeScript)
│   │   ├── client.ts                  # Octokit init, rate limit, auth
│   │   ├── orgs.ts                    # Org discovery and resolution
│   │   ├── repos.ts                   # Repo querying and file operations
│   │   └── events.ts                  # Event streaming and polling
│   ├── stream/                        # Real-time event streaming (TypeScript)
│   │   ├── engine.ts                  # Polling engine (EventEmitter-based)
│   │   └── handlers.ts               # Console, filter, JSON handlers
│   ├── remote/                        # Remote operations (TypeScript)
│   │   ├── sync.ts                    # Org/repo scanning and manifest
│   │   └── broadcast.ts              # Multi-repo file broadcasting
│   ├── scraper/                       # JS scraper modules
│   │   ├── config.js                  # Scraper config (5 repos, retry settings)
│   │   ├── fetch.js                   # Fetch with retry/timeout
│   │   ├── github-scraper.js          # Class-based scraper (axios)
│   │   ├── index.js                   # Orchestrator (API with local fallback)
│   │   └── local.js                   # Fallback via git ls-remote
│   ├── scrapers/
│   │   └── github.js                  # Direct GitHub API scraper (native HTTPS)
│   ├── seo/
│   │   ├── generate.js                # SEO artifact generator (JSON-LD, graph)
│   │   └── seo-analyzer.js            # Live SEO page analyzer (axios/cheerio)
│   ├── metrics/
│   │   ├── report.js                  # Report generator from verified data
│   │   └── verify.js                  # Verification gate (6 checks)
│   ├── dashboard/
│   │   └── status.js                  # Status dashboard generator
│   ├── e2e/                           # E2E test runners and tests
│   │   ├── run.js                     # CLI entry point
│   │   ├── runner.js                  # E2E runner class with health checks
│   │   └── *.test.js                  # Pipeline, report, scraper, verify tests
│   ├── types/
│   │   └── repo.js                    # Repo type definitions + target list
│   └── utils/                         # Shared utilities (TypeScript)
│       ├── logger.ts                  # Structured logging with levels
│       ├── retry.ts                   # Exponential backoff retry
│       └── concurrency.ts            # Concurrent map with pool limit
├── tests/                             # Test suites (Python + JS)
│   ├── conftest.py                    # Pytest fixtures (live scraping)
│   ├── test_scraper_e2e.py            # Python E2E test suite
│   └── unit/                          # JS unit tests (scraper, SEO, verify)
├── _analysis/                         # Analysis output
├── _archive/                          # Archived files
├── _raw/                              # Raw data
├── _sorted/                           # Sorted/categorized files
├── _scripts/
│   └── blackroad_master_init.sh       # System analysis and scaffold
├── .env.example                       # Environment variable template
├── .gitignore                         # Git ignore rules
├── CLAUDE.md                          # This file
├── CODE_OF_CONDUCT.md                 # Contributor Covenant v2.0
├── CONTRIBUTING.md                    # Contribution guidelines
├── CURRENT_STATE.md                   # Infrastructure state snapshot
├── ISSUE_TRANSLATIONS.md              # Cross-repo issue bridge
├── LICENSE                            # BlackRoad OS proprietary license
├── README.md                          # Project readme
├── package.json                       # Node.js package config
├── pyproject.toml                     # Python project config
├── requirements.txt                   # Python dependencies
└── tsconfig.json                      # TypeScript compiler config
```

## Technology Stack

### Node.js / TypeScript (Primary)

- **Runtime**: Node.js >= 18 (CI uses v20 and v22)
- **TypeScript**: ES2022 target, Node16 module resolution, strict mode
- **Output**: `dist/` directory (compiled from `src/`)
- **Package manager**: npm
- **Entry points**: `bin/operator.js` (CLI) and `src/index.js` (scraper)
- **Test runner**: `node:test` (built-in)

### Python

- **Version**: >= 3.10
- **Dependencies**: `requests`, `beautifulsoup4`, `pytest`
- **Config**: `pyproject.toml` (pytest paths: `tests/`, pythonpath: `.`)
- **Package**: `scraper/` module with `__init__.py`

### Configuration

- **Environment**: `.env` file (see `.env.example` for template)
- **Required**: `GITHUB_TOKEN` with `repo`, `read:org`, `admin:org` scopes
- **Config files**: YAML (`config/automation.yaml`, `config/orgs.yaml`) and JSON (`config/blackroad.json`, `config/targets.json`)

## Key Subsystems

### 1. Remote Streaming Engine (TypeScript)

The core TypeScript library (`src/index.ts`) exports:
- **GitHub API layer**: Org discovery, repo management, event streaming via Octokit
- **Stream engine**: EventEmitter-based poller for real-time GitHub events
- **Remote operations**: Org scanning (`scanAll`), multi-repo file broadcasting (`broadcastFile`)
- **CLI** (`src/cli.ts`): Commands — `scan`, `stream`, `status`, `broadcast`, `rate-limit`

### 2. Scraper Pipeline (JS + Python)

Multiple scraper implementations that collect live repo metrics:
- **JS scrapers**: `src/scrapers/github.js` (native HTTPS), `src/scraper/` (fetch/axios with retry), `scraper/index.js` (curl-based)
- **Python scraper**: `scraper/github_scraper.py` (stdlib urllib only)
- **Fallback**: Local git proxy via `git ls-remote` when GitHub API is unreachable
- **Output**: JSON files in `data/` directory

### 3. Verification Gate

Every metric must be freshly scraped and validated before publishing:
- `src/verify.js`: Checks data freshness (< 1 hour), required fields, numeric types
- `src/metrics/verify.js`: 6 checks (API reachable, exists, license, commits, fresh, valid numbers)
- **Core rule**: If a number can't be fetched, it's reported as "unavailable" — never fabricated

### 4. Infrastructure Audit

Health checks for GitHub orgs and domains:
- **Node.js**: `audit/runner.js` runs DNS, HTTPS, SSL, and GitHub org checks
- **Shell**: `infrastructure/audit.sh` checks orgs (existence, activity) and domains (DNS, HTTPS, SSL)
- **Spec**: `docs/VERIFICATION_SPEC.md` defines 6 formal verification checks with pass/fail criteria

### 5. SEO System

- `src/seo/generate.js`: Builds repo relationship graph, generates JSON-LD (schema.org), ecosystem index
- `src/seo/seo-analyzer.js`: Analyzes live web pages for SEO signals
- `scraper/seo_analyzer.py`: Scores repos on 10 signals (0-100 scale)

### 6. E2E Testing

Multi-layer test suites:
- **Python**: `tests/test_scraper_e2e.py` (scraper, SEO, report, pipeline integration)
- **Python E2E**: `e2e/test_repos.py` (repo health), `e2e/test_scraper.py` (scraper functions)
- **JS E2E**: `e2e/readme.test.js` (README integrity), `e2e/repos.test.js` (live API cross-validation), `e2e/scraper.test.js` (scraper output)
- **JS Unit**: `tests/unit/` (scraper, SEO, verify)

### 7. File Organization Tools

Scripts for managing large repos (100k+ files):
- `scripts/inventory.sh` → `scripts/deduplicate.sh` → `scripts/categorize.sh` → `scripts/safe-move.sh`
- `scripts/rollback.sh` for reversing moves
- All scripts support `--dry-run` mode

## CI/CD Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `audit.yml` | Push/PR to main, daily 06:00 UTC, manual | Infrastructure audit with artifact upload |
| `ci.yml` | Push/PR to main | Validate repo structure and JS syntax |
| `e2e-scrape.yml` | Every 6 hours, push/PR, manual | Scrape → verify → render README → auto-commit |
| `e2e-scraper.yml` | Every 6 hours, push/PR, manual | Enhanced scraper with retry and failure recovery |
| `e2e-tests.yml` | Push (main/master/claude/*), PR, 6-hourly | Python pytest + README update |
| `e2e.yml` | Push/PR, daily 06:00 UTC, manual | Unified pipeline via `scripts/run_all.py` |
| `tests.yml` | Push (main/master/claude/*), PR | Node.js tests with coverage |

## Common Commands

```bash
# Validate environment
bash scripts/bootstrap.sh

# Run the Node.js audit
node audit/runner.js

# Run the scraper pipeline (JS)
node src/index.js
node src/index.js --live        # continuous mode (re-scrape every 5 min)
node src/index.js --no-seo      # skip SEO generation

# Run the full pipeline (Python)
python3 scripts/run_all.py

# Run Python tests
pytest tests/ -v

# Run Node.js tests
npm test

# Run the infrastructure health check (shell)
bash infrastructure/audit.sh
```

## BlackRoad OS Core Principles

All contributions must align with these principles:

1. **Sovereignty** — Users own their data and infrastructure
2. **Privacy** — No telemetry, tracking, or external analytics
3. **Offline-First** — Core features must work without internet
4. **Design Excellence** — Follow the BlackRoad design system
5. **Production Quality** — Code must be reliable and scalable

### Strictly Prohibited

- External analytics or telemetry of any kind
- Required internet connectivity for core features
- Vendor lock-in mechanisms
- Cloud-only functionality
- Anything that compromises user privacy

## Data Integrity Rules

These rules are enforced across all scraper and verification code:

1. **No fabricated data** — If a metric can't be fetched, report "unavailable"
2. **Freshness required** — Data older than 1 hour is rejected
3. **Verification before publishing** — All numbers must pass the verification gate
4. **Graceful degradation** — Failed API calls result in omitted fields, never placeholders
5. **Timestamp everything** — Every data point includes its fetch timestamp
6. **No caching** — Data is used immediately or discarded; no stale fallbacks

## Automation Control-Flow Rules

From `docs/architecture.md`:

1. **Config first** — Repos must appear in `config/orgs.yaml` with `enabled: true` before any automation touches them
2. **Scripts only** — All mutations run through `scripts/`; no inline shell in workflows
3. **PR gate** — Every automated change requires human review before merge
4. **No distributed state** — All state is committed to the operator repo
5. **Kill-switch** — Set `global_enabled: false` in `config/automation.yaml` to pause all automation

## Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
```
feat(scraper): Add retry logic for rate-limited requests
fix(audit): Resolve SSL check timeout on slow domains
docs(runbook): Update operational reset procedure
chore(ci): Upgrade Node.js to v22 in tests workflow
```

## Branch Naming

Use the pattern: `feature/description` (e.g., `feature/amazing-feature`).

## Pull Request Process

PRs must follow the template in `.github/PULL_REQUEST_TEMPLATE.md`:
- Describe the change and link related issues
- Select change type (bug fix, feature, breaking change, docs, style, refactor)
- Confirm testing: existing tests pass, new tests added, manual testing done
- Verify BlackRoad OS alignment: sovereignty, privacy, offline capability, no unnecessary external dependencies, follows design system

## Issue Templates

- **Bug reports** (`.github/ISSUE_TEMPLATE/bug_report.md`): Include reproduction steps, expected vs actual behavior, environment details
- **Feature requests** (`.github/ISSUE_TEMPLATE/feature_request.md`): Include problem description, proposed solution, BlackRoad OS alignment checklist

## Development Guidelines

### Code Standards

- Follow language-specific best practices
- Write self-documenting code
- Add comments only for complex logic
- Keep functions small and focused
- Use meaningful variable names

### When Adding New Code

- Ensure any dependencies respect the offline-first and privacy principles
- Avoid dependencies that phone home, collect telemetry, or require cloud services
- Prefer vendored or self-hosted dependencies where possible
- Every new automation target must first be declared in `config/orgs.yaml` with `enabled: false`
- New scraped metrics must pass through the verification gate before publishing

### Environment Setup

```bash
# Clone and enter repo
git clone https://github.com/BlackRoad-OS/operator.git
cd operator

# Copy environment template
cp .env.example .env
# Edit .env and set GITHUB_TOKEN

# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt

# Validate environment
bash scripts/bootstrap.sh
```

## Contact

- **GitHub Issues**: For bug reports and feature requests
- **Email**: blackroad.systems@gmail.com
- **Website**: [blackroad.io](https://blackroad.io)
