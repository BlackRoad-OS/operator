import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { REPOS, ORG } from "../scraper/config.js";

const dataDir = join(process.cwd(), "data");
const resultsPath = join(dataDir, "scrape-results.json");

describe("Scraper E2E", () => {
  before(() => {
    // Run the scraper before tests
    console.log("  Running scraper...");
    execSync("node src/scraper/index.js", { stdio: "pipe", timeout: 120_000 });
  });

  it("should produce a scrape-results.json file", () => {
    assert.ok(existsSync(resultsPath), "scrape-results.json must exist after scraping");
  });

  it("should have valid JSON structure", () => {
    const data = JSON.parse(readFileSync(resultsPath, "utf-8"));
    assert.equal(data.org, ORG);
    assert.equal(typeof data.scraped_at, "string");
    assert.equal(typeof data.elapsed_ms, "number");
    assert.equal(typeof data.total, "number");
    assert.ok(Array.isArray(data.repos), "repos must be an array");
  });

  it("should attempt all 5 configured repos", () => {
    const data = JSON.parse(readFileSync(resultsPath, "utf-8"));
    const allNames = [
      ...data.repos.map((r) => r.name),
      ...(data.failures || []).map((f) => f.name),
    ];
    for (const repo of REPOS) {
      assert.ok(
        allNames.includes(repo.name),
        `Repo ${repo.name} must appear in results or failures`
      );
    }
  });

  it("should have a timestamp on every scraped repo", () => {
    const data = JSON.parse(readFileSync(resultsPath, "utf-8"));
    for (const repo of data.repos) {
      assert.equal(typeof repo.scraped_at, "string", `${repo.name} must have scraped_at`);
      const d = new Date(repo.scraped_at);
      assert.ok(!isNaN(d.getTime()), `${repo.name} scraped_at must be valid ISO date`);
    }
  });

  it("should write individual repo files", () => {
    const data = JSON.parse(readFileSync(resultsPath, "utf-8"));
    for (const repo of data.repos) {
      const repoFile = join(dataDir, `${repo.name}.json`);
      assert.ok(existsSync(repoFile), `${repo.name}.json must exist`);
      const individual = JSON.parse(readFileSync(repoFile, "utf-8"));
      assert.equal(individual.name, repo.name);
    }
  });

  it("should write a last-run.json for real-time tracking", () => {
    const lastRunPath = join(dataDir, "last-run.json");
    assert.ok(existsSync(lastRunPath), "last-run.json must exist");
    const lastRun = JSON.parse(readFileSync(lastRunPath, "utf-8"));
    assert.equal(typeof lastRun.timestamp, "string");
    assert.equal(typeof lastRun.elapsed_ms, "number");
    assert.equal(typeof lastRun.reachable, "number");
    assert.equal(typeof lastRun.total, "number");
  });

  it("should record elapsed time > 0", () => {
    const data = JSON.parse(readFileSync(resultsPath, "utf-8"));
    assert.ok(data.elapsed_ms > 0, "Elapsed time must be positive");
  });
});
