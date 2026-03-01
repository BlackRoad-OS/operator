#!/usr/bin/env node

/**
 * BlackRoad Operator — main entry point.
 * Scrapes target repos, writes verified data, optionally generates SEO output.
 */

import { scrapeAll } from "./scrapers/github.js";
import { writeFileSync, mkdirSync } from "node:fs";
import { verifyData } from "./verify.js";
import { generateSEO } from "./seo/generate.js";
import { REPO_TARGETS } from "./types/repo.js";

async function main() {
  const isLive = process.argv.includes("--live");
  const skipSEO = process.argv.includes("--no-seo");

  console.log(`\n[operator] Scraping ${REPO_TARGETS.length} repos...`);
  if (isLive) console.log("[operator] Live mode — will re-scrape every 5 minutes\n");

  async function runCycle() {
    const results = await scrapeAll();

    // Convert Map to plain object for JSON
    const output = {
      scraped_at: Date.now(),
      repos: {},
    };
    for (const [name, result] of results) {
      output.repos[name] = result;
      const status = result.success ? `OK (${result.duration_ms}ms)` : `FAIL: ${result.error}`;
      console.log(`  ${name}: ${status}`);
    }

    // Write data
    mkdirSync("data", { recursive: true });
    writeFileSync("data/latest.json", JSON.stringify(output, null, 2));
    console.log(`\n[operator] Data written to data/latest.json`);

    // Verify
    const verification = verifyData();
    console.log(`[operator] Verification: ${verification.valid ? "PASS" : "FAIL"}`);
    if (verification.warnings.length) {
      verification.warnings.forEach((w) => console.log(`  ! ${w}`));
    }
    if (verification.errors.length) {
      verification.errors.forEach((e) => console.log(`  ✗ ${e}`));
    }

    // Generate SEO
    if (!skipSEO) {
      try {
        generateSEO();
        console.log("[operator] SEO artifacts generated.");
      } catch (err) {
        console.log(`[operator] SEO generation failed: ${err.message}`);
      }
    }

    return verification;
  }

  const result = await runCycle();

  if (isLive) {
    console.log("\n[operator] Live mode active. Ctrl+C to stop.\n");
    setInterval(async () => {
      console.log(`\n[operator] Re-scraping at ${new Date().toISOString()}...`);
      await runCycle();
    }, 5 * 60 * 1000);
  } else {
    process.exit(result.valid ? 0 : 1);
  }
}

main().catch((err) => {
  console.error("[operator] Fatal:", err);
  process.exit(1);
});
