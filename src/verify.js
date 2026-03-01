/**
 * Verification module — ensures no metric is written unless it was scraped
 * from a live source and can be independently confirmed.
 *
 * Rule: If a number can't be fetched, it's "unavailable", never fabricated.
 */

import { readFileSync, existsSync } from "node:fs";

const DATA_PATH = "data/latest.json";
const MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

/**
 * @typedef {Object} VerificationResult
 * @property {boolean} valid
 * @property {string[]} errors
 * @property {string[]} warnings
 * @property {Object} summary
 */

/**
 * Verify that scraped data is real and fresh.
 * @returns {VerificationResult}
 */
export function verifyData() {
  const errors = [];
  const warnings = [];
  const summary = {};

  if (!existsSync(DATA_PATH)) {
    return { valid: false, errors: ["No data file found. Run scraper first."], warnings, summary };
  }

  let data;
  try {
    data = JSON.parse(readFileSync(DATA_PATH, "utf-8"));
  } catch {
    return { valid: false, errors: ["Data file is not valid JSON."], warnings, summary };
  }

  if (!data.scraped_at) {
    errors.push("Missing scraped_at timestamp — can't verify freshness.");
  } else {
    const age = Date.now() - data.scraped_at;
    if (age > MAX_AGE_MS) {
      warnings.push(`Data is ${Math.round(age / 60000)} minutes old. Re-scrape recommended.`);
    }
    summary.age_minutes = Math.round(age / 60000);
  }

  if (!data.repos || typeof data.repos !== "object") {
    errors.push("Missing repos object in data.");
    return { valid: false, errors, warnings, summary };
  }

  let totalSuccess = 0;
  let totalFailed = 0;

  for (const [name, result] of Object.entries(data.repos)) {
    if (!result.success) {
      totalFailed++;
      warnings.push(`${name}: scrape failed — "${result.error}". Will show as unavailable.`);
      continue;
    }

    totalSuccess++;
    const d = result.data;

    // Verify required fields exist and are correct types
    if (typeof d.stars !== "number") errors.push(`${name}: stars is not a number`);
    if (typeof d.forks !== "number") errors.push(`${name}: forks is not a number`);
    if (typeof d.open_issues !== "number") errors.push(`${name}: open_issues is not a number`);
    if (typeof d.size_kb !== "number") errors.push(`${name}: size_kb is not a number`);
    if (!d.full_name) errors.push(`${name}: missing full_name`);
    if (!d.html_url) errors.push(`${name}: missing html_url`);
    if (!d.scraped_at) errors.push(`${name}: missing scraped_at timestamp`);

    // Verify scraped_at is recent (not hardcoded)
    if (d.scraped_at && typeof d.scraped_at === "number") {
      const itemAge = Date.now() - d.scraped_at;
      if (itemAge > MAX_AGE_MS) {
        warnings.push(`${name}: data is ${Math.round(itemAge / 60000)} min old`);
      }
    }
  }

  summary.total_repos = totalSuccess + totalFailed;
  summary.successful = totalSuccess;
  summary.failed = totalFailed;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary,
  };
}

// CLI entry point
if (process.argv[1]?.endsWith("verify.js")) {
  const result = verifyData();
  console.log("\n=== Data Verification ===\n");
  console.log(`Status: ${result.valid ? "VALID" : "INVALID"}`);
  console.log(`Summary:`, JSON.stringify(result.summary, null, 2));
  if (result.errors.length) {
    console.log(`\nErrors (${result.errors.length}):`);
    result.errors.forEach((e) => console.log(`  ✗ ${e}`));
  }
  if (result.warnings.length) {
    console.log(`\nWarnings (${result.warnings.length}):`);
    result.warnings.forEach((w) => console.log(`  ! ${w}`));
  }
  process.exit(result.valid ? 0 : 1);
}
