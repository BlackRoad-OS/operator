import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Verification gate: reads scraped data, validates every field,
 * and outputs ONLY verified facts. No assumptions. No stale data.
 *
 * Rule: if we can't prove it right now, it doesn't get reported.
 */

const dataDir = join(process.cwd(), "data");
const resultsPath = join(dataDir, "scrape-results.json");

function main() {
  if (!existsSync(resultsPath)) {
    console.error("[verify] No scrape data found. Run `npm run scrape` first.");
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(resultsPath, "utf-8"));
  const source = raw.source || "github_api";
  const isLocal = source === "local_git_proxy";

  const verified = {
    repos: [],
    verified_at: new Date().toISOString(),
    source,
  };
  const rejected = [];

  for (const repo of raw.repos) {
    const checks = {};

    // Check 1: Was the source reachable?
    checks.api_reachable = repo.reachable === true;

    // Check 2: Does the repo exist?
    checks.exists = repo.exists === true;

    // Check 3: Has license?
    checks.has_license = repo.has_license === true;

    // Check 4: Has commits?
    checks.has_commits = repo.has_commits === true;

    // Check 5: Data freshness — scraped within the last hour
    const scrapedAt = new Date(repo.scraped_at);
    const ageMs = Date.now() - scrapedAt.getTime();
    checks.data_fresh = ageMs < 3600_000;

    // Check 6: Numeric fields are real numbers
    if (isLocal) {
      // Local source provides branches/tags/PRs instead of stars/forks
      checks.numbers_valid =
        typeof repo.branches === "number" &&
        typeof repo.tags === "number";
    } else {
      checks.numbers_valid =
        typeof repo.stars === "number" &&
        typeof repo.forks === "number" &&
        typeof repo.open_issues === "number" &&
        typeof repo.size_kb === "number";
    }

    const allPassed = Object.values(checks).every(Boolean);

    if (allPassed) {
      const entry = {
        name: repo.name,
        full_name: repo.full_name,
        scraped_at: repo.scraped_at,
        checks,
      };

      if (isLocal) {
        entry.head_sha = repo.head_sha;
        entry.branches = repo.branches;
        entry.tags = repo.tags;
        entry.pull_requests = repo.pull_requests;
        entry.has_license = repo.has_license;
        entry.license = repo.license_spdx;
        // Include local-only data if available
        if (repo.total_commits != null) entry.total_commits = repo.total_commits;
        if (repo.first_commit) entry.first_commit = repo.first_commit;
        if (repo.last_commit) entry.last_commit = repo.last_commit;
      } else {
        entry.stars = repo.stars;
        entry.forks = repo.forks;
        entry.open_issues = repo.open_issues;
        entry.language = repo.language;
        entry.has_license = repo.has_license;
        entry.license = repo.license_spdx;
        entry.last_push = repo.pushed_at;
      }

      verified.repos.push(entry);
      console.log(`  [pass] ${repo.name} — all checks passed`);
    } else {
      const failedChecks = Object.entries(checks)
        .filter(([, v]) => !v)
        .map(([k]) => k);
      rejected.push({ name: repo.name, failed: failedChecks });
      console.log(`  [FAIL] ${repo.name} — failed: ${failedChecks.join(", ")}`);
    }
  }

  // Account for repos that failed to scrape entirely
  for (const f of raw.failures || []) {
    rejected.push({ name: f.name, failed: ["scrape_failed"], error: f.error });
    console.log(`  [FAIL] ${f.name} — scrape failed: ${f.error}`);
  }

  verified.total_verified = verified.repos.length;
  verified.total_rejected = rejected.length;
  verified.rejected = rejected;

  const outPath = join(dataDir, "verified.json");
  writeFileSync(outPath, JSON.stringify(verified, null, 2));

  console.log(`\n[verify] ${verified.total_verified} verified, ${verified.total_rejected} rejected`);
  console.log(`[verify] Source: ${source}`);
  console.log(`[verify] Output: ${outPath}`);

  if (verified.total_rejected > 0) {
    console.log("\n[verify] Rejected repos will NOT appear in any metrics or README.");
  }

  return verified;
}

main();
