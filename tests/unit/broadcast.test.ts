import { describe, it, expect } from "vitest";
import { reposToTargets, summarizeResults } from "../../src/remote/broadcast.js";
import type { BroadcastResult } from "../../src/remote/broadcast.js";

describe("broadcast utilities", () => {
  describe("reposToTargets", () => {
    it("filters out archived and disabled repos", () => {
      const repos = [
        { owner: "org", name: "active", archived: false, disabled: false, defaultBranch: "main" },
        { owner: "org", name: "archived", archived: true, disabled: false, defaultBranch: "main" },
        { owner: "org", name: "disabled", archived: false, disabled: true, defaultBranch: "main" },
      ] as any[];

      const targets = reposToTargets(repos);
      expect(targets).toHaveLength(1);
      expect(targets[0].repo).toBe("active");
    });

    it("maps repo fields correctly", () => {
      const repos = [
        {
          owner: "BlackRoad-OS",
          name: "operator",
          archived: false,
          disabled: false,
          defaultBranch: "main",
        },
      ] as any[];

      const targets = reposToTargets(repos);
      expect(targets[0]).toEqual({
        owner: "BlackRoad-OS",
        name: "operator",
        repo: "operator",
        defaultBranch: "main",
      });
    });

    it("handles empty array", () => {
      expect(reposToTargets([])).toEqual([]);
    });
  });

  describe("summarizeResults", () => {
    it("summarizes mixed results", () => {
      const results: BroadcastResult[] = [
        { target: { owner: "a", repo: "1", defaultBranch: "main" }, status: "created", message: "" },
        { target: { owner: "a", repo: "2", defaultBranch: "main" }, status: "updated", message: "" },
        { target: { owner: "a", repo: "3", defaultBranch: "main" }, status: "skipped", message: "" },
        { target: { owner: "a", repo: "4", defaultBranch: "main" }, status: "error", message: "" },
      ];

      const summary = summarizeResults(results);
      expect(summary).toContain("4 targets");
      expect(summary).toContain("created: 1");
      expect(summary).toContain("updated: 1");
      expect(summary).toContain("skipped: 1");
      expect(summary).toContain("errors:  1");
    });

    it("handles empty results", () => {
      const summary = summarizeResults([]);
      expect(summary).toContain("0 targets");
    });
  });
});
