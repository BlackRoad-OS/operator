import { describe, it, mock, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { scrapeRepo, scrapeAll } from "../../src/scrapers/github.js";
import { REPO_TARGETS } from "../../src/types/repo.js";

describe("scraper module", () => {
  describe("REPO_TARGETS", () => {
    it("should define exactly 5 target repos", () => {
      assert.equal(REPO_TARGETS.length, 5);
    });

    it("should only contain BlackRoad-OS repos", () => {
      for (const repo of REPO_TARGETS) {
        assert.ok(repo.startsWith("BlackRoad-OS/"), `${repo} should start with BlackRoad-OS/`);
      }
    });

    it("should contain no duplicates", () => {
      const unique = new Set(REPO_TARGETS);
      assert.equal(unique.size, REPO_TARGETS.length);
    });
  });

  describe("scrapeRepo", () => {
    it("should return a ScrapeResult shape on success", async () => {
      // Use a known public repo to test real scraping
      const result = await scrapeRepo("BlackRoad-OS/blackroad-os-core");

      assert.ok(typeof result === "object");
      assert.ok("success" in result, "should have success field");
      assert.ok("data" in result, "should have data field");
      assert.ok("error" in result, "should have error field");
      assert.ok("duration_ms" in result, "should have duration_ms field");
      assert.ok(typeof result.duration_ms === "number");

      if (result.success) {
        const d = result.data;
        assert.equal(d.full_name, "BlackRoad-OS/blackroad-os-core");
        assert.ok(typeof d.stars === "number", "stars should be a number");
        assert.ok(typeof d.forks === "number", "forks should be a number");
        assert.ok(typeof d.open_issues === "number", "open_issues should be a number");
        assert.ok(typeof d.size_kb === "number", "size_kb should be a number");
        assert.ok(typeof d.scraped_at === "number", "scraped_at should be a number");
        assert.ok(d.html_url.includes("github.com"), "html_url should be a GitHub URL");
      }
    });

    it("should return failure for non-existent repo", async () => {
      const result = await scrapeRepo("BlackRoad-OS/this-repo-does-not-exist-9999");
      assert.equal(result.success, false);
      assert.equal(result.data, null);
      assert.ok(result.error, "should have an error message");
      assert.ok(result.duration_ms > 0, "should track duration even on failure");
    });

    it("should populate scraped_at with current timestamp", async () => {
      const before = Date.now();
      const result = await scrapeRepo("BlackRoad-OS/blackroad-os-core");
      const after = Date.now();

      if (result.success) {
        assert.ok(result.data.scraped_at >= before, "scraped_at should be >= start time");
        assert.ok(result.data.scraped_at <= after, "scraped_at should be <= end time");
      }
    });
  });

  describe("scrapeAll", () => {
    it("should return results for all target repos", async () => {
      const results = await scrapeAll();
      assert.ok(results instanceof Map);
      assert.equal(results.size, REPO_TARGETS.length);

      for (const repo of REPO_TARGETS) {
        assert.ok(results.has(repo), `should have result for ${repo}`);
      }
    });

    it("should accept custom repo list", async () => {
      const custom = ["BlackRoad-OS/blackroad-os-core"];
      const results = await scrapeAll(custom);
      assert.equal(results.size, 1);
      assert.ok(results.has("BlackRoad-OS/blackroad-os-core"));
    });
  });
});
