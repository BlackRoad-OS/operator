#!/usr/bin/env node

/**
 * Unified E2E runner — the single entry point for the full pipeline.
 *
 * Pipeline stages:
 *   1. Scrape — fetch live data from GitHub API (or local git proxy)
 *   2. Verify — validate every field, reject stale/fake data
 *   3. Report — generate metrics from verified data only
 *   4. Test   — run node:test E2E suites against the results
 *
 * Usage:
 *   node scripts/e2e.js              # full pipeline
 *   node scripts/e2e.js --skip-test  # scrape + verify + report only
 *   node scripts/e2e.js --test-only  # run tests against existing data
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const args = process.argv.slice(2);
const skipTest = args.includes("--skip-test");
const testOnly = args.includes("--test-only");

function run(label, cmd) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${label}`);
  console.log(`${"=".repeat(60)}\n`);

  try {
    execSync(cmd, { cwd: ROOT, stdio: "inherit", timeout: 300_000 });
    return true;
  } catch (err) {
    console.error(`\n[FAIL] ${label}: exit code ${err.status || "unknown"}`);
    return false;
  }
}

function main() {
  const startTime = Date.now();
  console.log("[operator] E2E Pipeline");
  console.log(`[operator] Started: ${new Date().toISOString()}`);
  console.log(`[operator] Mode: ${testOnly ? "test-only" : skipTest ? "scrape+verify+report" : "full"}`);

  const results = { scrape: null, verify: null, report: null, test: null };

  if (!testOnly) {
    // Stage 1: Scrape
    results.scrape = run("Stage 1: Scrape", "node src/scraper/index.js");
    if (!results.scrape) {
      console.error("[operator] Scrape failed. Aborting pipeline.");
      process.exit(1);
    }

    // Stage 2: Verify
    results.verify = run("Stage 2: Verify", "node src/metrics/verify.js");

    // Stage 3: Report
    results.report = run("Stage 3: Report", "node src/metrics/report.js");
  } else {
    // Validate that data exists for test-only mode
    if (!existsSync(join(ROOT, "data", "scrape-results.json"))) {
      console.error("[operator] No scrape data found. Run without --test-only first.");
      process.exit(1);
    }
    console.log("[operator] Using existing scrape data for test-only mode.");
  }

  if (!skipTest) {
    // Stage 4: Tests
    console.log("");

    // Unit tests
    results.test = run(
      "Stage 4a: Unit Tests",
      "node --test --test-concurrency=1 tests/unit/*.test.js"
    );

    // E2E tests (pipeline/report/verify)
    const e2eResult = run(
      "Stage 4b: E2E Tests (pipeline)",
      "node --test --test-concurrency=1 src/e2e/*.test.js"
    );
    results.test = results.test && e2eResult;

    // E2E scraper tests (if scraper data dir exists)
    if (existsSync(join(ROOT, "scraper", "data"))) {
      const scraperResult = run(
        "Stage 4c: E2E Tests (scraper cross-validation)",
        "node --test e2e/*.test.js"
      );
      results.test = results.test && scraperResult;
    }
  }

  // Summary
  const elapsed = Date.now() - startTime;
  console.log(`\n${"=".repeat(60)}`);
  console.log("  E2E Pipeline Summary");
  console.log(`${"=".repeat(60)}`);
  console.log(`  Elapsed: ${(elapsed / 1000).toFixed(1)}s`);

  for (const [stage, passed] of Object.entries(results)) {
    if (passed === null) continue;
    const icon = passed ? "PASS" : "FAIL";
    console.log(`  [${icon}] ${stage}`);
  }

  const failed = Object.values(results).some((v) => v === false);
  console.log(`\n  Result: ${failed ? "FAILED" : "PASSED"}`);
  console.log(`${"=".repeat(60)}\n`);

  process.exit(failed ? 1 : 0);
}

main();
