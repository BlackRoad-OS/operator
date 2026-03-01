import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { verifyData } from "../../src/verify.js";

describe("verification module", () => {
  beforeEach(() => {
    mkdirSync("data", { recursive: true });
  });

  afterEach(() => {
    if (existsSync("data/latest.json")) {
      rmSync("data/latest.json");
    }
  });

  it("should fail when no data file exists", () => {
    if (existsSync("data/latest.json")) rmSync("data/latest.json");
    const result = verifyData();
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("No data file")));
  });

  it("should fail on invalid JSON", () => {
    writeFileSync("data/latest.json", "not json {{{");
    const result = verifyData();
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("not valid JSON")));
  });

  it("should fail when scraped_at is missing", () => {
    writeFileSync("data/latest.json", JSON.stringify({ repos: {} }));
    const result = verifyData();
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("scraped_at")));
  });

  it("should warn on stale data", () => {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    writeFileSync(
      "data/latest.json",
      JSON.stringify({
        scraped_at: twoHoursAgo,
        repos: {},
      }),
    );
    const result = verifyData();
    assert.ok(result.warnings.some((w) => w.includes("Re-scrape")));
  });

  it("should validate successful repo data types", () => {
    writeFileSync(
      "data/latest.json",
      JSON.stringify({
        scraped_at: Date.now(),
        repos: {
          "BlackRoad-OS/test": {
            success: true,
            data: {
              stars: 5,
              forks: 2,
              open_issues: 1,
              size_kb: 100,
              full_name: "BlackRoad-OS/test",
              html_url: "https://github.com/BlackRoad-OS/test",
              scraped_at: Date.now(),
            },
            error: null,
            duration_ms: 50,
          },
        },
      }),
    );
    const result = verifyData();
    assert.equal(result.valid, true);
    assert.equal(result.summary.successful, 1);
    assert.equal(result.summary.failed, 0);
  });

  it("should catch non-number stars", () => {
    writeFileSync(
      "data/latest.json",
      JSON.stringify({
        scraped_at: Date.now(),
        repos: {
          "BlackRoad-OS/bad": {
            success: true,
            data: {
              stars: "many",
              forks: 2,
              open_issues: 1,
              size_kb: 100,
              full_name: "BlackRoad-OS/bad",
              html_url: "https://github.com/BlackRoad-OS/bad",
              scraped_at: Date.now(),
            },
            error: null,
            duration_ms: 50,
          },
        },
      }),
    );
    const result = verifyData();
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("stars is not a number")));
  });

  it("should count failed scrapes correctly", () => {
    writeFileSync(
      "data/latest.json",
      JSON.stringify({
        scraped_at: Date.now(),
        repos: {
          "BlackRoad-OS/ok": {
            success: true,
            data: {
              stars: 0, forks: 0, open_issues: 0, size_kb: 10,
              full_name: "BlackRoad-OS/ok",
              html_url: "https://github.com/BlackRoad-OS/ok",
              scraped_at: Date.now(),
            },
            error: null, duration_ms: 30,
          },
          "BlackRoad-OS/broken": {
            success: false, data: null,
            error: "HTTP 403", duration_ms: 100,
          },
        },
      }),
    );
    const result = verifyData();
    assert.equal(result.valid, true); // Failed scrapes are warnings, not errors
    assert.equal(result.summary.successful, 1);
    assert.equal(result.summary.failed, 1);
    assert.ok(result.warnings.some((w) => w.includes("broken")));
  });
});
