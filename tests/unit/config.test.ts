import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, loadState } from "../../src/config.ts";

describe("config", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("throws if GITHUB_TOKEN is not set", () => {
    delete process.env.GITHUB_TOKEN;
    expect(() => loadConfig()).toThrow("GITHUB_TOKEN is required");
  });

  it("loads config with token", () => {
    process.env.GITHUB_TOKEN = "test-token-123";
    delete process.env.OPERATOR_ORGS;
    const config = loadConfig();

    expect(config.token).toBe("test-token-123");
    expect(config.orgs).toEqual([]);
    expect(config.concurrency).toBe(10);
    expect(config.logLevel).toBe("info");
    expect(config.stream.interval).toBe(30000);
  });

  it("parses OPERATOR_ORGS", () => {
    process.env.GITHUB_TOKEN = "test-token";
    process.env.OPERATOR_ORGS = "org1, org2, org3";
    const config = loadConfig();
    expect(config.orgs).toEqual(["org1", "org2", "org3"]);
  });

  it("loadState returns empty state for missing file", () => {
    const state = loadState("/tmp/nonexistent-dir-" + Date.now());
    expect(state).toEqual({ lastScan: null, orgs: {}, streamCursor: {} });
  });
});
