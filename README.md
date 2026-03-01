# operator

Cross-repo scraper, E2E test pipeline, and SEO engine for the BlackRoad OS ecosystem.

## What this does

Scrapes live data from 5 core BlackRoad repos via the GitHub API, verifies every number is real, generates SEO cross-linking artifacts, and tests the full pipeline end-to-end.

**Target repos:**

| Repo | Role |
|------|------|
| [blackroad](https://github.com/BlackRoad-OS/blackroad) | Core monorepo |
| [blackroad-os-core](https://github.com/BlackRoad-OS/blackroad-os-core) | Main app — desktop UI, backend APIs, auth |
| [blackroad-os-api](https://github.com/BlackRoad-OS/blackroad-os-api) | API Gateway |
| [blackroad-os-web](https://github.com/BlackRoad-OS/blackroad-os-web) | Web API / FastAPI backend |
| [blackroad-os-prism-console](https://github.com/BlackRoad-OS/blackroad-os-prism-console) | Prism Console |

## Commands

```bash
npm run scrape          # Scrape all 5 repos, write data/latest.json
npm run scrape:live     # Scrape + re-run every 5 minutes
npm run verify          # Verify data is real and fresh
npm run seo:generate    # Generate SEO artifacts from scraped data
npm test                # Run all 35 tests (unit + E2E)
npm run test:unit       # Unit tests only
npm run test:e2e        # E2E pipeline tests only
```

## Architecture

```
src/
  index.js              — Entry point. Scrape → verify → SEO pipeline
  scrapers/github.js    — GitHub API scraper (repo metadata, languages, commits, contributors)
  seo/generate.js       — SEO engine: repo graph, JSON-LD structured data, ecosystem index
  verify.js             — Data verification: rejects stale, fabricated, or malformed metrics
  types/repo.js         — Type definitions and target repo list
tests/
  unit/                 — 24 unit tests (scraper, verify, SEO)
  e2e/                  — 11 E2E tests (full pipeline: scrape → verify → SEO)
.github/workflows/
  e2e.yml               — CI: unit tests on Node 18/20/22, E2E, scheduled scraping
```

## SEO approach

Instead of treating repos as disconnected pages (how Google indexes them), this builds a **directed relationship graph** across the ecosystem:

- Each repo gets a role (monorepo, core, api, web, console)
- Cross-links are generated based on actual relationships (extends, powers, consumes, renders, sibling, related)
- JSON-LD structured data (`schema.org/SoftwareSourceCode`) ties them together as a single software system
- The ecosystem index computes aggregate totals from live-scraped data only

## Verification rules

No number appears in output unless:
1. It was fetched from a live API endpoint in the current scrape cycle
2. It passes type checking (numbers must be numbers, URLs must be URLs)
3. The `scraped_at` timestamp is recent (< 1 hour)
4. Failed scrapes are labeled "unavailable" — never backfilled or guessed
