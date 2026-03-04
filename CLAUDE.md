# CLAUDE.md — AI Assistant Guide for `operator`

## Project Overview

**operator** is the canonical control repo for the [BlackRoad OS](https://blackroad.io) platform, owned by BlackRoad OS, Inc. (Delaware C-Corporation, founded by Alexa Louise Amundson). All automation, configuration, and infrastructure definitions originate here. No automation runs against any org or repo unless it is declared in this repo first.

The codebase is a **polyglot** project (Node.js + TypeScript + Python) that provides:
- An infrastructure audit runner
- A centralized remote streaming engine for GitHub org management
- E2E scrapers and SEO analyzers for BlackRoad repos
- File organization tooling for large-scale directory management
- Static web pages (directory, status, 404)

## Repository Structure

```
operator/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md              # Bug report template
│   │   └── feature_request.md         # Feature request template
│   ├── PULL_REQUEST_TEMPLATE.md       # PR template with checklist
│   └── workflows/
│       ├── audit.yml                  # Infrastructure audit (daily + on push/PR)
│       ├── ci.yml                     # CI: validates repo structure & JS syntax
│       ├── e2e.yml                    # E2E scrape + test pipeline (daily + on push/PR)
│       ├── e2e-scrape.yml             # E2E scrape workflow
│       ├── e2e-scraper.yml            # E2E scraper workflow
│       ├── e2e-tests.yml              # E2E test runner
│       └── tests.yml                  # Unit tests with coverage
├── audit/                             # Infrastructure audit system
│   ├── checks/
│   │   ├── dns.js                     # DNS resolution checks
│   │   ├── github.js                  # GitHub org health checks
│   │   ├── https.js                   # HTTPS availability checks
│   │   └── ssl.js                     # SSL certificate checks
│   ├── run.js                         # Audit entry point (alt)
│   └── runner.js                      # Main audit runner
├── bin/
│   └── operator.js                    # CLI entry point (imports dist/cli.js)
├── config/                            # Single source of truth for all configuration
│   ├── automation.yaml                # Automation settings + global kill-switch
│   ├── blackroad.json                 # Enterprise config (orgs, domains)
│   ├── orgs.yaml                      # Org/repo registry for automation targets
│   └── targets.json                   # E2E scraper target repos
├── data/                              # Scraped data and metrics output
├── docs/
│   ├── architecture.md                # System design and control-flow
│   ├── FILE-ORGANIZATION.md           # File org strategy for 100k+ file repos
│   ├── README.md                      # Docs index
│   ├── VERIFICATION_SPEC.md           # Verification specification
│   └── runbook.md                     # Operational runbook (reset procedure)
├── e2e/                               # E2E test suites (JS + Python)
├── e2e-tests/                         # Additional E2E tests
├── functions/
│   └── api.js                         # Serverless API functions
├── infra/                             # Infrastructure-as-code definitions
│   └── README.md
├── infrastructure/
│   ├── audit.sh                       # Shell-based audit script
│   └── config.json                    # Infrastructure config
├── public/                            # Static web assets
│   ├── css/style.css
│   ├── js/render.js
│   ├── index.html
│   ├── map.html
│   └── status.html
├── reports/                           # Generated audit/scrape reports
├── scraper/                           # Python + JS scraper modules
│   ├── config.py                      # Scraper target repos config
│   ├── github_scraper.py              # GitHub API scraper
│   ├── readme_writer.py               # README auto-updater
│   ├── report.py                      # Report generator
│   ├── seo_analyzer.py                # SEO analysis
│   ├── seo_scraper.py                 # SEO data scraper
│   └── update_readme.py               # README update logic
├── scripts/                           # Approved automation entry-points
│   ├── bootstrap.sh                   # Environment validation
│   ├── categorize.sh                  # File categorization
│   ├── deduplicate.sh                 # SHA-256 deduplication
│   ├── inventory.sh                   # File inventory/manifest generator
│   ├── rollback.sh                    # Safe rollback from audit log
│   ├── run_all.py                     # Full pipeline: scrape + test + README
│   └── safe-move.sh                   # Audited file moves (dry-run default)
├── src/                               # TypeScript source (streaming engine)
│   ├── cli.ts                         # CLI implementation
│   ├── config.ts                      # Config loader + state management
│   ├── index.ts                       # Main exports
│   ├── github/                        # GitHub API client modules
│   │   ├── client.ts                  # Authenticated GitHub client
│   │   ├── events.ts                  # Org/repo event polling
│   │   ├── orgs.ts                    # Org discovery + details
│   │   └── repos.ts                   # Repo operations (content, branches)
│   ├── remote/                        # Remote sync + broadcast
│   │   ├── broadcast.ts               # File broadcasting to target repos
│   │   └── sync.ts                    # Org-wide scanning + sync manifests
│   ├── stream/                        # Streaming engine
│   │   ├── engine.ts                  # Core stream engine
│   │   └── handlers.ts               # Console, filter, JSON handlers
│   └── utils/                         # Shared utilities
│       ├── concurrency.ts             # Concurrent map helper
│       ├── logger.ts                  # Structured logger
│       └── retry.ts                   # Retry with backoff
├── tests/                             # Test suites (JS + Python)
│   ├── conftest.py                    # Pytest configuration
│   ├── unit/                          # Unit tests (JS)
│   └── *.test.js                      # Integration tests
├── _analysis/, _archive/, _raw/, _sorted/  # Data pipeline staging dirs
├── .env.example                       # Environment variable template
├── .gitignore
├── CLAUDE.md                          # This file
├── CODE_OF_CONDUCT.md                 # Contributor Covenant v2.0
├── CONTRIBUTING.md                    # Contribution guidelines
├── CURRENT_STATE.md                   # Platform state snapshot
├── LICENSE                            # BlackRoad OS proprietary license
├── README.md                          # Project readme
├── package.json                       # Node.js config (audit runner)
├── package-lock.json
├── pyproject.toml                     # Python project config
├── requirements.txt                   # Python dependencies
└── tsconfig.json                      # TypeScript config (ES2022, strict)
```

## Tech Stack

| Layer | Technology | Config File |
|-------|-----------|-------------|
| Runtime (JS) | Node.js >= 18 | `package.json` |
| TypeScript | ES2022, strict, Node16 modules | `tsconfig.json` |
| Runtime (Python) | Python >= 3.10 | `pyproject.toml` |
| Python deps | requests, beautifulsoup4, pytest | `requirements.txt` |
| CI/CD | GitHub Actions | `.github/workflows/` |

## Licensing

This is **proprietary software** — NOT open source. The LICENSE file is a comprehensive proprietary license from BlackRoad OS, Inc. Do not add open-source license headers, SPDX identifiers, or any licensing that conflicts with the existing proprietary license.

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

## Development Setup

```bash
# Node.js dependencies (audit runner, tests)
npm install

# Python dependencies (scraper, e2e tests)
pip install -r requirements.txt

# Environment variables
cp .env.example .env
# Edit .env with your GITHUB_TOKEN
```

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `GITHUB_TOKEN` | GitHub PAT (scopes: repo, read:org, admin:org) |
| `OPERATOR_ORGS` | Comma-separated GitHub orgs to operate on |
| `OPERATOR_STREAM_INTERVAL` | Streaming poll interval (ms, default 30000) |
| `OPERATOR_STREAM_BATCH_SIZE` | Batch size (default 100) |
| `OPERATOR_CONCURRENCY` | Concurrent operations limit (default 10) |
| `OPERATOR_LOG_LEVEL` | Log level: debug, info, warn, error |
| `OPERATOR_DATA_DIR` | Local state directory (default .operator) |

## Key Commands

```bash
# Run infrastructure audit
node audit/runner.js

# Run full E2E pipeline (scrape + test + README update)
python3 scripts/run_all.py

# Run Python tests
pytest

# Run Node.js tests
npm test

# Validate environment
bash scripts/bootstrap.sh

# File organization (always dry-run first)
./scripts/inventory.sh /path/to/files ./output
./scripts/categorize.sh ./output/inventory.tsv ./output
./scripts/safe-move.sh --dry-run ./output/move-plan.tsv ./target
```

## Architecture

`operator` follows a **config-first, single-source-of-truth** model:

```
operator (this repo)
  /config  <- all config lives here
  /docs    <- all docs live here
  /scripts <- all automation entry-points
  /infra   <- all infra-as-code
       |
       v  (reads config/)
  GitHub Actions CI
       |
       v  (approved automation only)
  Target repos/orgs (declared in config/orgs.yaml)
```

### Control-Flow Rules

1. **Config first** — A repo/org must appear in `config/orgs.yaml` with `enabled: true` before any automation touches it
2. **Scripts only** — Automated mutations run exclusively through `scripts/`; no inline shell in workflow files
3. **PR gate** — Every automated change opens a PR and requires human review before merge
4. **No distributed state** — Agents do not maintain state outside this repo

### Key Configuration Files

- **`config/automation.yaml`** — Global automation kill-switch and per-target overrides. Set `global_enabled: false` to halt all automation instantly.
- **`config/orgs.yaml`** — Registry of orgs/repos eligible for automation. Only `enabled: true` entries are touched.
- **`config/blackroad.json`** — Enterprise identity (org names, domains) for the audit runner.
- **`config/targets.json`** — The 5 target repos for E2E scraping.

## CI/CD Workflows

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| CI | `ci.yml` | push/PR to main | Validates repo structure, JSON config, JS syntax |
| Infrastructure Audit | `audit.yml` | push/PR to main, daily 06:00 UTC, manual | Runs DNS/HTTPS/SSL/GitHub checks, uploads artifacts |
| E2E Scrape & Test | `e2e.yml` | push/PR to main, daily 06:00 UTC, manual | Scrapes target repos, runs tests, updates README |
| Tests | `tests.yml` | push to main/master/claude/**, PR to main/master | npm test with coverage |

## Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
```
feat(audit): add SSL expiry warning threshold
fix(scraper): handle rate-limited GitHub API responses
docs(runbook): add incident response procedure
chore(ci): pin actions to SHA hashes
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

## Operational Runbook

See `docs/runbook.md` for full procedures. Key operations:

- **Emergency stop**: Set `global_enabled: false` in `config/automation.yaml` and merge
- **Disable single target**: Set `enabled: false` in `config/orgs.yaml` and merge
- **Add new repo**: Add to `config/orgs.yaml` with `enabled: false`, PR + review, then flip to `true`
- **Full reset**: See `docs/runbook.md#operational-reset`

## Code Standards

- Follow language-specific best practices (Node.js, TypeScript, Python)
- Write self-documenting code
- Add comments only for complex logic
- Keep functions small and focused
- Use meaningful variable names
- TypeScript: strict mode enabled, target ES2022
- Python: >= 3.10, use pytest for tests

### When Adding New Code

- Ensure any dependencies respect the offline-first and privacy principles
- Avoid dependencies that phone home, collect telemetry, or require cloud services
- Prefer vendored or self-hosted dependencies where possible
- Pin GitHub Actions to commit SHAs (see `audit.yml` for examples)

## Contact

- **GitHub Issues**: For bug reports and feature requests
- **Email**: blackroad.systems@gmail.com
- **Website**: [blackroad.io](https://blackroad.io)
