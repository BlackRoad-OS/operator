# E2E Test Reports

Reports are now generated automatically by the unified E2E pipeline.

## How to run

```bash
# Full pipeline: scrape → verify → report → test
npm run e2e

# Or step by step
npm run scrape
npm run verify
npm run report
npm test
```

## Where reports go

- `data/scrape-results.json` — raw scrape output
- `data/verified.json` — verification gate output
- `data/readme-metrics.md` — verified metrics table
- `data/last-run.json` — timestamp for real-time tracking

## CI

Reports are produced automatically by `.github/workflows/e2e.yml` every 6 hours and on every push.
