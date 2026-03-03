import { describe, it, expect, vi, afterEach } from "vitest";
import { withRetry } from "../../src/utils/retry.js";

describe("withRetry", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns result on first success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await withRetry(fn, "test");
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledOnce();
  });

  it("retries on failure and succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail1"))
      .mockResolvedValue("ok");

    const result = await withRetry(fn, "test", {
      maxAttempts: 3,
      baseDelay: 10,
    });

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("throws after exhausting retries", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("persistent failure"));

    await expect(
      withRetry(fn, "test", { maxAttempts: 2, baseDelay: 10 })
    ).rejects.toThrow("persistent failure");

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("uses exponential backoff", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("ok");

    const start = Date.now();
    await withRetry(fn, "test", { maxAttempts: 3, baseDelay: 50, maxDelay: 200 });
    const elapsed = Date.now() - start;

    // Should have delayed ~50ms + ~100ms = ~150ms minimum
    expect(elapsed).toBeGreaterThanOrEqual(100);
  });
});
