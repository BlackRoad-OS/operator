/**
 * E2E Test: README Integrity
 *
 * Ensures the README only contains data that traces back to
 * a verified scrape. No stale numbers, no assumptions.
 */

import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const README_PATH = join(ROOT, "README.md");
const DATA_PATH = join(ROOT, "scraper", "data", "repos.json");

describe("README Integrity", () => {
  before(() => {
    // Re-render README from latest data
    execSync("node scraper/render-readme.js", { cwd: ROOT, timeout: 10_000 });
  });

  it("README.md exists and is non-empty", () => {
    assert.ok(existsSync(README_PATH), "README.md must exist");
    const content = readFileSync(README_PATH, "utf8");
    assert.ok(content.length > 100, "README must have real content");
  });

  it("README contains data provenance section", () => {
    const content = readFileSync(README_PATH, "utf8");
    assert.ok(content.includes("Data Provenance"), "must have provenance section");
    assert.ok(content.includes("Scraped at:"), "must show scrape timestamp");
    assert.ok(content.includes("GitHub REST API"), "must cite data source");
  });

  it("README numbers match scraped data exactly", () => {
    const content = readFileSync(README_PATH, "utf8");
    const snapshot = JSON.parse(readFileSync(DATA_PATH, "utf8"));
    const okRepos = snapshot.repos.filter((r) => r._status === "ok");

    // Check total issues matches
    const totalIssues = okRepos.reduce((s, r) => s + (r.open_issues_count || 0), 0);
    assert.ok(
      content.includes(`${totalIssues}`),
      `README must contain verified total issues (${totalIssues})`
    );

    // Check each repo name appears
    for (const r of okRepos) {
      assert.ok(
        content.includes(r.name || r.full_name),
        `README must list repo: ${r.full_name}`
      );
    }

    // Check star counts appear
    const totalStars = okRepos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
    assert.ok(
      content.includes(`${totalStars}`),
      `README must contain verified total stars (${totalStars})`
    );
  });

  it("README does not contain placeholder text", () => {
    const content = readFileSync(README_PATH, "utf8");
    const placeholders = ["TODO", "TBD", "FIXME", "placeholder", "example.com", "N/A"];
    for (const p of placeholders) {
      assert.ok(
        !content.includes(p),
        `README must not contain placeholder: "${p}"`
      );
    }
  });

  it("README scrape timestamp matches data file", () => {
    const content = readFileSync(README_PATH, "utf8");
    const snapshot = JSON.parse(readFileSync(DATA_PATH, "utf8"));
    assert.ok(
      content.includes(snapshot.scraped_at),
      "README timestamp must match data file timestamp"
    );
  });

  it("README repo count matches data", () => {
    const content = readFileSync(README_PATH, "utf8");
    const snapshot = JSON.parse(readFileSync(DATA_PATH, "utf8"));
    const okCount = snapshot.repos.filter((r) => r._status === "ok").length;
    assert.ok(
      content.includes(`Monitored Repos (${okCount})`),
      `README must show correct repo count (${okCount})`
    );
  });
});
