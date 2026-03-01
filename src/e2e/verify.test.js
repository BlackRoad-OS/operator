import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const dataDir = join(process.cwd(), "data");
const verifiedPath = join(dataDir, "verified.json");

describe("Verification E2E", () => {
  before(() => {
    // Ensure scrape data exists, then run verification
    if (!existsSync(join(dataDir, "scrape-results.json"))) {
      console.log("  Running scraper first...");
      execSync("node src/scraper/index.js", { stdio: "pipe", timeout: 120_000 });
    }
    console.log("  Running verifier...");
    execSync("node src/metrics/verify.js", { stdio: "pipe", timeout: 30_000 });
  });

  it("should produce a verified.json file", () => {
    assert.ok(existsSync(verifiedPath), "verified.json must exist");
  });

  it("should have valid structure", () => {
    const data = JSON.parse(readFileSync(verifiedPath, "utf-8"));
    assert.equal(typeof data.verified_at, "string");
    assert.ok(["live_github_api", "github_api", "local_git_proxy"].includes(data.source));
    assert.ok(Array.isArray(data.repos));
    assert.equal(typeof data.total_verified, "number");
    assert.equal(typeof data.total_rejected, "number");
  });

  it("verified + rejected should equal total repos attempted", () => {
    const data = JSON.parse(readFileSync(verifiedPath, "utf-8"));
    const scrapeData = JSON.parse(
      readFileSync(join(dataDir, "scrape-results.json"), "utf-8")
    );
    const totalAttempted = scrapeData.repos.length + (scrapeData.failures || []).length;
    assert.equal(
      data.total_verified + data.total_rejected,
      totalAttempted,
      "Every repo must be accounted for (verified or rejected)"
    );
  });

  it("verified repos must have all checks passing", () => {
    const data = JSON.parse(readFileSync(verifiedPath, "utf-8"));
    for (const repo of data.repos) {
      assert.ok(repo.checks, `${repo.name} must have checks object`);
      for (const [check, passed] of Object.entries(repo.checks)) {
        assert.equal(passed, true, `${repo.name} check "${check}" must pass`);
      }
    }
  });

  it("verified repos must have real numbers, not placeholders", () => {
    const data = JSON.parse(readFileSync(verifiedPath, "utf-8"));
    const isLocal = data.source === "local_git_proxy";

    for (const repo of data.repos) {
      if (isLocal) {
        assert.equal(typeof repo.branches, "number", `${repo.name}.branches must be a number`);
        assert.equal(typeof repo.tags, "number", `${repo.name}.tags must be a number`);
        assert.ok(repo.branches >= 0, `${repo.name}.branches must be >= 0`);
      } else {
        assert.equal(typeof repo.stars, "number", `${repo.name}.stars must be a number`);
        assert.equal(typeof repo.forks, "number", `${repo.name}.forks must be a number`);
        assert.equal(typeof repo.open_issues, "number", `${repo.name}.open_issues must be a number`);
        assert.ok(repo.stars >= 0);
        assert.ok(repo.forks >= 0);
      }
    }
  });

  it("rejected repos must list which checks failed", () => {
    const data = JSON.parse(readFileSync(verifiedPath, "utf-8"));
    for (const repo of data.rejected) {
      assert.ok(
        Array.isArray(repo.failed) && repo.failed.length > 0,
        `Rejected repo ${repo.name} must list failed checks`
      );
    }
  });

  it("should not report stale data as verified", () => {
    const data = JSON.parse(readFileSync(verifiedPath, "utf-8"));
    const verifiedAt = new Date(data.verified_at);
    const ageMs = Date.now() - verifiedAt.getTime();
    assert.ok(ageMs < 3600_000, "Verified data must be less than 1 hour old");
  });
});
