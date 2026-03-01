import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const dataDir = join(process.cwd(), "data");

describe("Report E2E", () => {
  before(() => {
    // Full pipeline: scrape -> verify -> report
    if (!existsSync(join(dataDir, "scrape-results.json"))) {
      console.log("  Running scraper...");
      execSync("node src/scraper/index.js", { stdio: "pipe", timeout: 120_000 });
    }
    if (!existsSync(join(dataDir, "verified.json"))) {
      console.log("  Running verifier...");
      execSync("node src/metrics/verify.js", { stdio: "pipe", timeout: 30_000 });
    }
    console.log("  Running report generator...");
    execSync("node src/metrics/report.js", { stdio: "pipe", timeout: 30_000 });
  });

  it("should produce a readme-metrics.md file", () => {
    const metricsPath = join(dataDir, "readme-metrics.md");
    assert.ok(existsSync(metricsPath), "readme-metrics.md must exist");
  });

  it("should contain only verified repo names in the metrics table", () => {
    const metricsContent = readFileSync(join(dataDir, "readme-metrics.md"), "utf-8");
    const verified = JSON.parse(readFileSync(join(dataDir, "verified.json"), "utf-8"));

    // Every verified repo should appear
    for (const repo of verified.repos) {
      assert.ok(
        metricsContent.includes(repo.name),
        `Verified repo ${repo.name} must appear in metrics`
      );
    }

    // No rejected repo should appear in the table rows (they can appear in the rejection note)
    for (const repo of verified.rejected) {
      // Check it's not in a table row (starts with |)
      const tableRows = metricsContent
        .split("\n")
        .filter((line) => line.startsWith("| ") && !line.startsWith("| Repo") && !line.startsWith("|--"));
      for (const row of tableRows) {
        assert.ok(
          !row.includes(repo.name),
          `Rejected repo ${repo.name} must NOT appear in metrics table`
        );
      }
    }
  });

  it("should include the verification timestamp", () => {
    const metricsContent = readFileSync(join(dataDir, "readme-metrics.md"), "utf-8");
    assert.ok(
      metricsContent.includes("Scraped") || metricsContent.includes("verified"),
      "Metrics must include scrape/verification timestamp"
    );
  });

  it("should not contain placeholder or dummy numbers", () => {
    const metricsContent = readFileSync(join(dataDir, "readme-metrics.md"), "utf-8");
    // Check that table cells don't contain "undefined", "null", "NaN", or "TODO"
    const badPatterns = ["undefined", "NaN", "TODO", "PLACEHOLDER", "TBD"];
    for (const pattern of badPatterns) {
      assert.ok(
        !metricsContent.includes(pattern),
        `Metrics must not contain "${pattern}"`
      );
    }
  });
});
