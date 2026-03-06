# Test Coverage Analysis

**Date:** 2026-03-06
**Scope:** Full codebase audit of existing tests and identification of coverage gaps

---

## Current State

The project has **19 test files** (~2,100 lines of test code) spanning JavaScript (Node.js built-in `test`, Jest) and Python (pytest). Coverage is concentrated on the **scraper, SEO, and verification** subsystems, while several major subsystems have **zero test coverage**.

### What IS Tested

| Module | Test Files | Coverage Level |
|---|---|---|
| `src/scraper.js` | `tests/unit/scraper.test.js` | Good — targets, single/batch scraping |
| `src/seo/generate.js` | `tests/unit/seo.test.js` | Good — artifacts, JSON-LD, roles, cross-links |
| `src/verify.js` | `tests/unit/verify.test.js` | Good — freshness, types, failure counts |
| `src/dashboard/status.js` | `tests/dashboard.test.js` | Good — load, markdown, JSON output |
| `src/e2e-runner.js` | `tests/e2e-runner.test.js` | Good — health checks, archived/stale detection |
| `src/scraper/github-scraper.js` | `tests/github-scraper.test.js` | Good — all methods, retry, mocked network |
| `src/seo/seo-analyzer.js` | `tests/seo-analyzer.test.js` | Good — scoring, batch, edge cases |
| `scraper/` (Python) | `tests/test_scraper_e2e.py`, `e2e/test_*.py` | Good — live API, SEO, report, pipeline |

### What is NOT Tested

The following modules have **no dedicated tests at all**:

| Module | Lines | Risk |
|---|---|---|
| `src/cli.ts` | ~80 | **High** — user-facing entry point |
| `src/config.ts` | ~50 | **High** — env parsing, token validation |
| `src/github/client.ts` | ~30 | Medium — Octokit init, rate limit |
| `src/github/events.ts` | ~60 | **High** — cursor-based event polling |
| `src/github/orgs.ts` | ~50 | **High** — org discovery and resolution |
| `src/github/repos.ts` | ~80 | **High** — repo CRUD, file operations |
| `src/stream/engine.ts` | ~100 | **High** — EventEmitter polling, state |
| `src/stream/handlers.ts` | ~60 | Medium — console/filter/JSON handlers |
| `src/remote/broadcast.ts` | ~80 | **High** — writes to remote repos |
| `src/remote/sync.ts` | ~70 | **High** — full org scanning |
| `src/utils/concurrency.ts` | ~20 | Medium — mapConcurrent |
| `src/utils/logger.ts` | ~40 | Low — formatting |
| `src/utils/retry.ts` | ~30 | Medium — backoff logic |
| `src/automation.js` | ~100 | **High** — multi-stage pipeline |
| `src/readme-updater.js` | ~60 | Medium — README generation |
| `src/scraper/fetch.js` | ~40 | Medium — retry, rate-limit detection |
| `src/scraper/local.js` | ~50 | Medium — local git fallback |
| `src/scraper/index.js` | ~60 | Medium — fallback orchestration |
| `src/metrics/report.js` | ~50 | Medium — markdown metrics |
| `src/metrics/verify.js` | ~60 | Medium — verification gate |
| `audit/*` (all 6 files) | ~300 | **High** — infrastructure checks |
| `functions/api.js` | ~40 | Medium — Cloudflare function |
| `scraper/readme_writer.py` | ~60 | Medium — README generation |
| `scraper/update_readme.py` | ~40 | Medium — live update pipeline |

---

## Recommended Improvements (Priority Order)

### 1. TypeScript Core — Zero Coverage, High Risk

**Files:** `src/github/repos.ts`, `src/github/orgs.ts`, `src/github/events.ts`, `src/github/client.ts`

These modules handle all GitHub API interactions (repo CRUD, org discovery, event polling) and have no tests. A single regression here silently breaks every downstream feature.

**Recommended tests:**
- Mock Octokit and test each exported function in isolation
- Test pagination handling in `listOrgRepos`
- Test `getFileContent` / `putFileContent` for encoding edge cases
- Test `pollOrgEvents` cursor logic — verify it correctly resumes from saved cursor
- Test rate-limit error propagation from `checkRateLimit`

---

### 2. Stream Engine — Zero Coverage, Stateful Logic

**Files:** `src/stream/engine.ts`, `src/stream/handlers.ts`

The stream engine manages long-running EventEmitter-based polling with state persistence and graceful shutdown. This kind of stateful, async code is where bugs hide.

**Recommended tests:**
- Test `start()` / `stop()` lifecycle — verify polling starts and stops cleanly
- Test that `SIGINT`/`SIGTERM` handlers trigger graceful shutdown
- Test state persistence — cursor saved correctly between poll cycles
- Test multi-org streaming (events from multiple orgs interleaved correctly)
- Test handler registration — filter handler actually filters, JSON handler emits valid JSON

---

### 3. Config & CLI — Zero Coverage, User-Facing

**Files:** `src/cli.ts`, `src/config.ts`

The CLI is the primary user interface. The config module handles env parsing and token validation. Untested CLI commands can silently fail or produce confusing errors.

**Recommended tests:**
- Test CLI command routing (`scan`, `stream`, `status`, `broadcast`, `rate-limit`, `help`)
- Test `help` and unknown-command output
- Test config loading with missing `.env` file
- Test `GITHUB_TOKEN` validation (present, empty, malformed)
- Test org resolution from `GITHUB_ORGS` env var (comma-separated, whitespace handling)
- Test data directory creation when `data/` doesn't exist

---

### 4. Broadcast & Sync — Zero Coverage, Destructive Operations

**Files:** `src/remote/broadcast.ts`, `src/remote/sync.ts`

Broadcast pushes files to multiple remote repos. A bug here can overwrite files across an entire org. This is the highest-consequence untested code.

**Recommended tests:**
- Test dry-run mode produces no write API calls
- Test broadcast to multiple repos — verify concurrent execution and result aggregation
- Test error handling when a single repo fails (others should continue)
- Test sync full-scan discovers all orgs and repos
- Test status retrieval includes latest commit per repo

---

### 5. Audit Subsystem — Zero Coverage, Infrastructure Checks

**Files:** `audit/run.js`, `audit/runner.js`, `audit/checks/dns.js`, `audit/checks/github.js`, `audit/checks/https.js`, `audit/checks/ssl.js`

The audit system checks DNS, HTTPS, SSL, and GitHub org health. These checks produce trust decisions — false positives or false negatives are both dangerous.

**Recommended tests:**
- Test each check in isolation with mocked network responses
- Test DNS check with valid/invalid domains
- Test HTTPS check with various status codes (200, 301, 404, timeout)
- Test SSL check with certificates expiring in <14 days, >14 days, and already expired
- Test GitHub org check with/without `GITHUB_TOKEN`
- Test audit runner aggregation — verify summary table formatting
- Test private vs public output separation

---

### 6. Automation Pipeline — Zero Coverage, Orchestration Logic

**File:** `src/automation.js`

This is the multi-stage pipeline orchestrator (scrape → test → README → report). It has failure recovery logic that generates recovery steps. No tests verify the stage sequencing or recovery behavior.

**Recommended tests:**
- Test that stages execute in order (stage N only runs after stage N-1 succeeds)
- Test that README update is skipped when verification fails
- Test recovery step generation for each failure mode
- Test that pipeline report captures all stage outcomes

---

### 7. Utility Functions — Low Coverage, Reusable Logic

**Files:** `src/utils/retry.ts`, `src/utils/concurrency.ts`, `src/utils/logger.ts`

These are reused throughout the codebase. The retry module especially is critical — incorrect backoff can cause rate-limiting cascades.

**Recommended tests:**
- Test retry with configurable attempts (1, 3, 5)
- Test exponential backoff timing (verify delays double)
- Test retry stops on non-retryable errors
- Test `mapConcurrent` respects concurrency limit
- Test `mapConcurrent` with tasks that throw (partial failure)

---

### 8. Scraper Fallback Path — Zero Coverage

**Files:** `src/scraper/local.js`, `src/scraper/index.js`, `src/scraper/fetch.js`

The scraper has a fallback path from GitHub API to local git proxy. The local proxy and the fallback orchestration are untested.

**Recommended tests:**
- Test `fetchWithRetry` rate-limit detection (403 with `X-RateLimit-Remaining: 0`)
- Test local git proxy scraping with a real local repo
- Test fallback: API fails → local proxy kicks in
- Test per-repo output file creation

---

### 9. Python README Writer & Updater — Zero Coverage

**Files:** `scraper/readme_writer.py`, `scraper/update_readme.py`

These modules generate and update the README from scraped data. The writer has marker-based section replacement that is fragile without tests.

**Recommended tests:**
- Test marker detection and section replacement
- Test that content outside markers is preserved
- Test with missing markers (should handle gracefully)
- Test that only verified data appears in output

---

## Structural Issues

### Test Organization

Tests are scattered across **four directories** (`tests/`, `tests/unit/`, `tests/e2e/`, `e2e/`, `src/e2e/`) with no unified test runner configuration. The `package.json` has no `test` script — only `"audit"`. This means:

- There is no single `npm test` command to run all JS tests
- No coverage reporting tool is configured (no istanbul/c8/nyc)
- No CI workflow runs the unit tests (the `tests.yml` workflow should be verified)

**Recommendations:**
- Add a `"test"` script to `package.json` that runs all unit tests
- Add a `"test:e2e"` script for E2E tests
- Configure `c8` or `nyc` for code coverage reporting
- Add coverage thresholds to CI to prevent regression

### TypeScript Tests Missing Entirely

All 14 TypeScript source files have **zero test coverage**. There is no `tsconfig` for tests, no test runner configured for `.ts` files. The TypeScript modules represent the newer, more architecturally significant parts of the codebase (CLI, streaming, broadcasting, GitHub client).

**Recommendation:** Set up a TypeScript-aware test runner (e.g., `vitest` or `tsx` + Node test runner) and prioritize tests for the `src/github/`, `src/stream/`, and `src/remote/` modules.

### Duplicate Test Files

Several test files exist in multiple locations with overlapping scope:
- `src/e2e/scraper.test.js` vs `e2e/scraper.test.js` vs `tests/unit/scraper.test.js`
- `src/e2e/pipeline.test.js` vs `tests/e2e/pipeline.test.js`
- `src/e2e/verify.test.js` vs `tests/unit/verify.test.js`

This creates maintenance burden and confusion about which tests are canonical. Consider consolidating into a single test directory structure.

---

## Summary

| Priority | Area | Files | Impact |
|---|---|---|---|
| **P0** | GitHub API client (TS) | 4 files | Every feature depends on this |
| **P0** | Broadcast / Sync (TS) | 2 files | Destructive remote operations |
| **P1** | Stream engine (TS) | 2 files | Long-running stateful process |
| **P1** | CLI & Config (TS) | 2 files | User-facing entry point |
| **P1** | Audit subsystem (JS) | 6 files | Trust/security decisions |
| **P2** | Automation pipeline (JS) | 1 file | Orchestration with recovery |
| **P2** | Utility functions (TS) | 3 files | Reused across codebase |
| **P2** | Scraper fallback (JS) | 3 files | Reliability path |
| **P3** | Python README tools | 2 files | Content generation |
| **P3** | Test infrastructure | — | No unified runner, no coverage |

**Bottom line:** The existing tests do a good job covering the scraper and SEO subsystems, but **all 14 TypeScript modules** and the **audit subsystem** have zero test coverage. These represent the architectural core of the project and should be the top priority for new tests.
