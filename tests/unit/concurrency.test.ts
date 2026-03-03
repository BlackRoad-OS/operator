import { describe, it, expect } from "vitest";
import { mapConcurrent } from "../../src/utils/concurrency.js";

describe("mapConcurrent", () => {
  it("processes all items", async () => {
    const items = [1, 2, 3, 4, 5];
    const results = await mapConcurrent(items, 3, async (n) => n * 2);
    expect(results).toEqual([2, 4, 6, 8, 10]);
  });

  it("preserves order regardless of completion time", async () => {
    const items = [30, 10, 20];
    const results = await mapConcurrent(items, 3, async (ms, idx) => {
      await new Promise((r) => setTimeout(r, ms));
      return idx;
    });
    expect(results).toEqual([0, 1, 2]);
  });

  it("handles empty arrays", async () => {
    const results = await mapConcurrent([], 5, async (n: number) => n);
    expect(results).toEqual([]);
  });

  it("respects concurrency limit", async () => {
    let activeCalls = 0;
    let maxActive = 0;

    const items = Array.from({ length: 10 }, (_, i) => i);
    await mapConcurrent(items, 3, async (n) => {
      activeCalls++;
      maxActive = Math.max(maxActive, activeCalls);
      await new Promise((r) => setTimeout(r, 10));
      activeCalls--;
      return n;
    });

    expect(maxActive).toBeLessThanOrEqual(3);
  });

  it("propagates errors", async () => {
    const items = [1, 2, 3];
    await expect(
      mapConcurrent(items, 2, async (n) => {
        if (n === 2) throw new Error("fail");
        return n;
      })
    ).rejects.toThrow("fail");
  });
});
