import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { readFileSync, existsSync, rmSync } from "node:fs";

describe("E2E: Full scrape → verify → SEO pipeline", () => {
  before(() => {
    // Clean any prior data
    if (existsSync("data/latest.json")) rmSync("data/latest.json");
    if (existsSync("data/seo")) rmSync("data/seo", { recursive: true });
  });

  after(() => {
    // Don't clean up — leave data for inspection
  });

  it("should run the full scraper and produce data/latest.json", () => {
    // Run the scraper via npm
    const output = execSync("node src/index.js --no-seo", {
      encoding: "utf-8",
      timeout: 120000,
      env: { ...process.env, NODE_ENV: "test" },
    });

    assert.ok(output.includes("[operator] Scraping"), "should log scraping start");
    assert.ok(output.includes("data/latest.json"), "should mention output file");
    assert.ok(existsSync("data/latest.json"), "data file should exist after scrape");
  });

  it("should produce valid JSON with correct structure", () => {
    const raw = readFileSync("data/latest.json", "utf-8");
    const data = JSON.parse(raw);

    assert.ok(data.scraped_at, "should have scraped_at");
    assert.ok(typeof data.scraped_at === "number", "scraped_at should be a number");
    assert.ok(data.repos, "should have repos object");
    assert.ok(Object.keys(data.repos).length > 0, "should have at least one repo");
  });

  it("should contain data for all 5 target repos", () => {
    const data = JSON.parse(readFileSync("data/latest.json", "utf-8"));
    const expected = [
      "BlackRoad-OS/blackroad",
      "BlackRoad-OS/blackroad-os-core",
      "BlackRoad-OS/blackroad-os-api",
      "BlackRoad-OS/blackroad-os-web",
      "BlackRoad-OS/blackroad-os-prism-console",
    ];
    for (const repo of expected) {
      assert.ok(repo in data.repos, `should have scraped ${repo}`);
    }
  });

  it("should have real scraped_at timestamps (not hardcoded)", () => {
    const data = JSON.parse(readFileSync("data/latest.json", "utf-8"));
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    assert.ok(data.scraped_at > fiveMinutesAgo, "data scraped_at should be recent");
    assert.ok(data.scraped_at <= now, "data scraped_at should not be in the future");

    // Check individual repos
    for (const [name, result] of Object.entries(data.repos)) {
      if (result.success && result.data) {
        assert.ok(
          result.data.scraped_at > fiveMinutesAgo,
          `${name} scraped_at should be recent`,
        );
      }
    }
  });

  it("should have real GitHub URLs for successful repos", () => {
    const data = JSON.parse(readFileSync("data/latest.json", "utf-8"));
    for (const [name, result] of Object.entries(data.repos)) {
      if (result.success && result.data) {
        assert.ok(
          result.data.html_url.startsWith("https://github.com/BlackRoad-OS/"),
          `${name} should have a real GitHub URL`,
        );
      }
    }
  });

  it("should track scrape duration for every repo", () => {
    const data = JSON.parse(readFileSync("data/latest.json", "utf-8"));
    for (const [name, result] of Object.entries(data.repos)) {
      assert.ok(typeof result.duration_ms === "number", `${name} should have duration_ms`);
      assert.ok(result.duration_ms > 0, `${name} duration should be > 0`);
    }
  });

  it("should run verification on freshly scraped data", () => {
    // Verification should complete without crashing.
    // If all scrapes succeeded, it should report VALID.
    // If some failed (rate limit, network), it should still report VALID
    // because failed scrapes are warnings, not errors.
    const output = execSync("node src/verify.js", {
      encoding: "utf-8",
      timeout: 10000,
    });
    assert.ok(output.includes("Verification"), "should run verification");
    assert.ok(output.includes("Summary"), "should show summary");
  });

  it("should generate SEO artifacts from scraped data", () => {
    const output = execSync("node src/seo/generate.js", {
      encoding: "utf-8",
      timeout: 10000,
    });

    assert.ok(existsSync("data/seo/graph.json"), "graph.json should be generated");
    assert.ok(existsSync("data/seo/structured-data.json"), "structured-data should be generated");
    assert.ok(existsSync("data/seo/ecosystem-index.json"), "ecosystem-index should be generated");
  });

  it("SEO structured data should have schema.org context", () => {
    const sd = JSON.parse(readFileSync("data/seo/structured-data.json", "utf-8"));
    assert.equal(sd["@context"], "https://schema.org");
    assert.equal(sd["@type"], "SoftwareSourceCode");
    assert.ok(Array.isArray(sd.hasPart), "hasPart should be an array");
    // If any repos were successfully scraped, they should appear here
    const data = JSON.parse(readFileSync("data/latest.json", "utf-8"));
    const successCount = Object.values(data.repos).filter((r) => r.success).length;
    assert.equal(sd.hasPart.length, successCount, "hasPart count should match successful scrapes");
  });

  it("SEO graph should reflect actual scrape results", () => {
    const graph = JSON.parse(readFileSync("data/seo/graph.json", "utf-8"));
    const data = JSON.parse(readFileSync("data/latest.json", "utf-8"));
    const successCount = Object.values(data.repos).filter((r) => r.success).length;

    assert.equal(Object.keys(graph).length, successCount, "graph entries should match successful scrapes");

    for (const [name, info] of Object.entries(graph)) {
      assert.ok(info.role, `${name} should have a role`);
      assert.ok(Array.isArray(info.links), `${name} should have links array`);
    }
  });

  it("ecosystem index numbers should match scraped data exactly", () => {
    const data = JSON.parse(readFileSync("data/latest.json", "utf-8"));
    const index = JSON.parse(readFileSync("data/seo/ecosystem-index.json", "utf-8"));

    // Count successful repos in raw data
    const successCount = Object.values(data.repos).filter((r) => r.success).length;
    assert.equal(index.total_repos_scraped, successCount, "repo count should match");

    // Verify issue total matches
    const expectedIssues = Object.values(data.repos)
      .filter((r) => r.success && r.data)
      .reduce((sum, r) => sum + (r.data.open_issues || 0), 0);
    assert.equal(index.total_issues, expectedIssues, "issue count should match scraped data");

    // Verify size total matches
    const expectedSize = Object.values(data.repos)
      .filter((r) => r.success && r.data)
      .reduce((sum, r) => sum + (r.data.size_kb || 0), 0);
    assert.equal(index.total_size_kb, expectedSize, "size should match scraped data");
  });
});
