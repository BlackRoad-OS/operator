import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { generateSEO } from "../../src/seo/generate.js";

describe("SEO generator", () => {
  const mockData = {
    scraped_at: Date.now(),
    repos: {
      "BlackRoad-OS/blackroad": {
        success: true,
        data: {
          name: "blackroad",
          full_name: "BlackRoad-OS/blackroad",
          description: "Core monorepo",
          language: "TypeScript",
          stars: 0,
          forks: 0,
          open_issues: 10,
          size_kb: 346663,
          html_url: "https://github.com/BlackRoad-OS/blackroad",
          topics: ["ai", "automation", "blackroad"],
          updated_at: "2026-03-01T02:53:50Z",
          created_at: "2025-11-24T05:42:05Z",
        },
        error: null,
        duration_ms: 200,
      },
      "BlackRoad-OS/blackroad-os-core": {
        success: true,
        data: {
          name: "blackroad-os-core",
          full_name: "BlackRoad-OS/blackroad-os-core",
          description: "Main app",
          language: "Python",
          stars: 0,
          forks: 0,
          open_issues: 8,
          size_kb: 7841,
          html_url: "https://github.com/BlackRoad-OS/blackroad-os-core",
          topics: ["ai", "blackroad"],
          updated_at: "2026-02-25T02:35:25Z",
          created_at: "2025-11-17T23:28:04Z",
        },
        error: null,
        duration_ms: 150,
      },
      "BlackRoad-OS/blackroad-os-api": {
        success: true,
        data: {
          name: "blackroad-os-api",
          full_name: "BlackRoad-OS/blackroad-os-api",
          description: "API Gateway",
          language: "TypeScript",
          stars: 0,
          forks: 0,
          open_issues: 8,
          size_kb: 865,
          html_url: "https://github.com/BlackRoad-OS/blackroad-os-api",
          topics: ["ai", "automation"],
          updated_at: "2026-02-25T02:35:29Z",
          created_at: "2025-11-17T23:35:30Z",
        },
        error: null,
        duration_ms: 120,
      },
    },
  };

  beforeEach(() => {
    mkdirSync("data", { recursive: true });
    writeFileSync("data/latest.json", JSON.stringify(mockData));
  });

  afterEach(() => {
    try { rmSync("data/latest.json", { force: true }); } catch {}
    try { rmSync("data/seo", { recursive: true, force: true }); } catch {}
  });

  it("should generate all 3 SEO artifact files", () => {
    generateSEO();
    assert.ok(existsSync("data/seo/graph.json"), "graph.json should exist");
    assert.ok(existsSync("data/seo/structured-data.json"), "structured-data.json should exist");
    assert.ok(existsSync("data/seo/ecosystem-index.json"), "ecosystem-index.json should exist");
  });

  it("should produce valid JSON-LD structured data", () => {
    const result = generateSEO();
    assert.equal(result.structuredData["@context"], "https://schema.org");
    assert.equal(result.structuredData["@type"], "SoftwareSourceCode");
    assert.ok(Array.isArray(result.structuredData.hasPart));
    assert.equal(result.structuredData.hasPart.length, 3);
  });

  it("should map all repos in the graph", () => {
    const result = generateSEO();
    assert.ok("BlackRoad-OS/blackroad" in result.graph);
    assert.ok("BlackRoad-OS/blackroad-os-core" in result.graph);
    assert.ok("BlackRoad-OS/blackroad-os-api" in result.graph);
  });

  it("should detect repo roles correctly", () => {
    const result = generateSEO();
    assert.equal(result.graph["BlackRoad-OS/blackroad"].role, "monorepo");
    assert.equal(result.graph["BlackRoad-OS/blackroad-os-core"].role, "core");
    assert.equal(result.graph["BlackRoad-OS/blackroad-os-api"].role, "api");
  });

  it("should create cross-links between repos", () => {
    const result = generateSEO();
    // Each repo should link to the others
    for (const [name, info] of Object.entries(result.graph)) {
      assert.ok(info.links.length > 0, `${name} should have at least one link`);
    }
  });

  it("should include real language data in ecosystem index", () => {
    const result = generateSEO();
    assert.ok(result.ecosystemIndex.languages.includes("TypeScript"));
    assert.ok(result.ecosystemIndex.languages.includes("Python"));
  });

  it("should calculate aggregate totals from real data", () => {
    const result = generateSEO();
    assert.equal(result.ecosystemIndex.total_repos_scraped, 3);
    assert.equal(result.ecosystemIndex.total_issues, 26); // 10 + 8 + 8
    assert.equal(result.ecosystemIndex.total_size_kb, 355369); // 346663 + 7841 + 865
  });

  it("should skip failed repos in SEO output", () => {
    const dataWithFail = {
      ...mockData,
      repos: {
        ...mockData.repos,
        "BlackRoad-OS/failed": {
          success: false,
          data: null,
          error: "HTTP 403",
          duration_ms: 50,
        },
      },
    };
    writeFileSync("data/latest.json", JSON.stringify(dataWithFail));
    const result = generateSEO();
    // Failed repo should not appear in graph or structured data
    assert.ok(!("BlackRoad-OS/failed" in result.graph));
    assert.equal(result.structuredData.hasPart.length, 3); // Still 3, not 4
  });

  it("should throw when no data file exists", () => {
    rmSync("data/latest.json");
    assert.throws(() => generateSEO(), /No data file/);
  });
});
