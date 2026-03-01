/**
 * E2E Test: Scraper
 *
 * Validates that the scraper produces correct, complete output.
 * If fresh data exists (< 10 min old), validates that.
 * Otherwise, runs the scraper fresh.
 */

import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA_PATH = join(ROOT, "scraper", "data", "repos.json");
const CONFIG_PATH = join(ROOT, "scraper", "repos.json");
const TEN_MINUTES = 10 * 60 * 1000;

function dataIsFresh() {
  if (!existsSync(DATA_PATH)) return false;
  try {
    const data = JSON.parse(readFileSync(DATA_PATH, "utf8"));
    const age = Date.now() - new Date(data.scraped_at).getTime();
    return age < TEN_MINUTES && data.repos_ok === data.repo_count;
  } catch {
    return false;
  }
}

describe("Scraper E2E", () => {
  before(() => {
    if (!dataIsFresh()) {
      console.log("    [scraper.test] Running fresh scrape...");
      execSync("node scraper/index.js", { cwd: ROOT, timeout: 300_000 });
    } else {
      console.log("    [scraper.test] Using existing fresh data.");
    }
  });

  it("produces repos.json output file", () => {
    assert.ok(existsSync(DATA_PATH), "scraper/data/repos.json must exist after scrape");
  });

  it("output is valid JSON with required top-level fields", () => {
    const data = JSON.parse(readFileSync(DATA_PATH, "utf8"));
    assert.ok(data.scraped_at, "must have scraped_at timestamp");
    assert.ok(data.org, "must have org data");
    assert.ok(Array.isArray(data.repos), "repos must be an array");
    assert.equal(typeof data.repo_count, "number");
    assert.equal(typeof data.repos_ok, "number");
    assert.equal(typeof data.repos_error, "number");
  });

  it("scraped all configured targets", () => {
    const config = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
    const data = JSON.parse(readFileSync(DATA_PATH, "utf8"));
    assert.equal(data.repo_count, config.targets.length, "must scrape every configured target");
  });

  it("each successful repo has all required fields", () => {
    const data = JSON.parse(readFileSync(DATA_PATH, "utf8"));
    const okRepos = data.repos.filter((r) => r._status === "ok");

    assert.ok(okRepos.length > 0, "must have at least 1 successful repo");

    for (const repo of okRepos) {
      assert.ok(repo.full_name, `${repo.name}: must have full_name`);
      assert.equal(typeof repo.stargazers_count, "number", `${repo.full_name}: stars must be number`);
      assert.equal(typeof repo.forks_count, "number", `${repo.full_name}: forks must be number`);
      assert.equal(typeof repo.open_issues_count, "number", `${repo.full_name}: issues must be number`);
      assert.equal(typeof repo.branch_count, "number", `${repo.full_name}: branches must be number`);
      assert.ok(repo._scraped_at, `${repo.full_name}: must have _scraped_at`);
      assert.ok(repo.recent_commits, `${repo.full_name}: must have recent_commits`);
      assert.ok(Array.isArray(repo.recent_commits), `${repo.full_name}: recent_commits must be array`);
    }
  });

  it("scraped_at timestamp is recent (within last 10 minutes)", () => {
    const data = JSON.parse(readFileSync(DATA_PATH, "utf8"));
    const scraped = new Date(data.scraped_at).getTime();
    const now = Date.now();
    assert.ok(now - scraped < TEN_MINUTES, `Data is stale: scraped ${Math.round((now - scraped) / 1000)}s ago`);
  });

  it("org data includes public_repos count", () => {
    const data = JSON.parse(readFileSync(DATA_PATH, "utf8"));
    assert.equal(typeof data.org.public_repos, "number");
    assert.ok(data.org.public_repos > 0, "org must have at least 1 public repo");
  });

  it("no repo has assumed/placeholder data", () => {
    const data = JSON.parse(readFileSync(DATA_PATH, "utf8"));
    for (const repo of data.repos) {
      if (repo._status === "ok") {
        assert.notEqual(repo.stargazers_count, "TODO");
        assert.notEqual(repo.open_issues_count, "TODO");
        assert.notEqual(repo.description, "TODO");
      }
    }
  });

  it("all repos report status ok", () => {
    const data = JSON.parse(readFileSync(DATA_PATH, "utf8"));
    assert.equal(data.repos_error, 0, "no repos should have failed");
    assert.equal(data.repos_ok, data.repo_count, "all repos should be ok");
  });
});
