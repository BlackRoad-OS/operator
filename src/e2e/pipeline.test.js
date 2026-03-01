import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { readFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const dataDir = join(process.cwd(), "data");

describe("Full Pipeline E2E", () => {
  it("should run the complete pipeline from scratch", () => {
    // Clean slate
    if (existsSync(dataDir)) {
      rmSync(dataDir, { recursive: true, force: true });
    }

    // Run full pipeline
    const output = execSync("npm run ci", {
      encoding: "utf-8",
      timeout: 180_000,
    });

    console.log("  Pipeline output length:", output.length, "chars");

    // Verify all artifacts exist
    assert.ok(existsSync(join(dataDir, "scrape-results.json")), "scrape-results.json created");
    assert.ok(existsSync(join(dataDir, "verified.json")), "verified.json created");
    assert.ok(existsSync(join(dataDir, "last-run.json")), "last-run.json created");
  });

  it("should be idempotent — running twice produces consistent results", () => {
    // First run already happened above. Run again.
    execSync("node src/scraper/index.js", { stdio: "pipe", timeout: 120_000 });

    const results = JSON.parse(readFileSync(join(dataDir, "scrape-results.json"), "utf-8"));

    // Same number of repos attempted
    assert.equal(results.total, 5, "Should always attempt 5 repos");

    // Structure is consistent
    assert.ok(Array.isArray(results.repos));
    assert.equal(typeof results.elapsed_ms, "number");
  });

  it("should handle network-unreachable repos gracefully", () => {
    const results = JSON.parse(readFileSync(join(dataDir, "scrape-results.json"), "utf-8"));

    // Every repo should have a clear status — no ambiguity
    for (const repo of results.repos) {
      assert.equal(typeof repo.reachable, "boolean", `${repo.name} must have boolean reachable`);
      assert.equal(typeof repo.scraped_at, "string", `${repo.name} must have scraped_at`);
    }

    // Failures should have error messages
    for (const f of results.failures || []) {
      assert.ok(f.name, "Failed repo must have a name");
      assert.ok(f.error, "Failed repo must have an error message");
    }
  });
});
