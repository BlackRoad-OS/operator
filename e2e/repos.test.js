/**
 * E2E Test: Repo Data Integrity
 *
 * Cross-validates scraped data against live GitHub API.
 * This is the "trust but verify" layer — the scraper says X,
 * we independently confirm X matches reality.
 *
 * Skips live validation gracefully if rate-limited (unauthenticated
 * limit is 60/hr). In CI with GITHUB_TOKEN, limit is 5000/hr.
 */

import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA_PATH = join(ROOT, "scraper", "data", "repos.json");

let rateLimited = false;

function checkRateLimit() {
  try {
    const stdout = execSync(
      "curl -s --max-time 10 'https://api.github.com/rate_limit'",
      { encoding: "utf8", timeout: 15_000 }
    );
    const data = JSON.parse(stdout);
    return data.resources?.core?.remaining ?? 0;
  } catch {
    return 0;
  }
}

function liveCheck(fullName) {
  if (rateLimited) return null;

  const token = process.env.GITHUB_TOKEN || "";
  const authArg = token ? `-H 'Authorization: Bearer ${token}'` : "";
  const cmd = `curl -s --max-time 25 -H 'Accept: application/vnd.github+json' -H 'User-Agent: blackroad-os-e2e-test/0.1' ${authArg} 'https://api.github.com/repos/${fullName}'`;
  try {
    const stdout = execSync(cmd, { timeout: 30_000, encoding: "utf8" });
    const data = JSON.parse(stdout);
    if (data.message && /rate limit/i.test(data.message)) {
      rateLimited = true;
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

describe("Repo Data Cross-Validation", () => {
  let snapshot;

  before(() => {
    snapshot = JSON.parse(readFileSync(DATA_PATH, "utf8"));
    const remaining = checkRateLimit();
    const needed = snapshot.repos.filter((r) => r._status === "ok").length * 4;
    if (remaining < needed) {
      rateLimited = true;
      console.log(`    [repos.test] Rate limited (${remaining} remaining, need ~${needed}). Skipping live checks.`);
    } else {
      console.log(`    [repos.test] Rate limit OK (${remaining} remaining). Running live checks.`);
    }
  });

  it("all scraped repos actually exist on GitHub", (t) => {
    if (rateLimited) { t.skip("Rate limited — skipping live check"); return; }
    for (const repo of snapshot.repos.filter((r) => r._status === "ok")) {
      const live = liveCheck(repo.full_name);
      if (!live) { t.skip("Rate limited mid-test"); return; }
      assert.equal(live.full_name, repo.full_name, `${repo.full_name} must exist`);
    }
  });

  it("scraped star counts match live API (tolerance: 0)", (t) => {
    if (rateLimited) { t.skip("Rate limited — skipping live check"); return; }
    for (const repo of snapshot.repos.filter((r) => r._status === "ok")) {
      const live = liveCheck(repo.full_name);
      if (!live) { t.skip("Rate limited mid-test"); return; }
      assert.equal(
        repo.stargazers_count,
        live.stargazers_count,
        `${repo.full_name}: stars mismatch (scraped=${repo.stargazers_count}, live=${live.stargazers_count})`
      );
    }
  });

  it("scraped issue counts are within reasonable drift (tolerance: 5)", (t) => {
    if (rateLimited) { t.skip("Rate limited — skipping live check"); return; }
    for (const repo of snapshot.repos.filter((r) => r._status === "ok")) {
      const live = liveCheck(repo.full_name);
      if (!live) { t.skip("Rate limited mid-test"); return; }
      const drift = Math.abs(repo.open_issues_count - live.open_issues_count);
      assert.ok(
        drift <= 5,
        `${repo.full_name}: issue count drifted too far (scraped=${repo.open_issues_count}, live=${live.open_issues_count}, drift=${drift})`
      );
    }
  });

  it("scraped languages match live API", (t) => {
    if (rateLimited) { t.skip("Rate limited — skipping live check"); return; }
    for (const repo of snapshot.repos.filter((r) => r._status === "ok")) {
      const live = liveCheck(repo.full_name);
      if (!live) { t.skip("Rate limited mid-test"); return; }
      assert.equal(
        repo.language,
        live.language,
        `${repo.full_name}: language mismatch (scraped=${repo.language}, live=${live.language})`
      );
    }
  });

  it("all repos belong to BlackRoad-OS org", () => {
    for (const repo of snapshot.repos) {
      assert.ok(
        repo.full_name?.startsWith("BlackRoad-OS/"),
        `${repo.full_name} must belong to BlackRoad-OS org`
      );
    }
  });
});
