import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createLogger, setLogLevel } from "../../src/utils/logger.js";

describe("logger", () => {
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    log: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, "debug").mockImplementation(() => {}),
      log: vi.spyOn(console, "log").mockImplementation(() => {}),
      warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
      error: vi.spyOn(console, "error").mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setLogLevel("info");
  });

  it("creates a logger with scope", () => {
    const log = createLogger("test-scope");
    expect(log).toBeDefined();
    expect(typeof log.debug).toBe("function");
    expect(typeof log.info).toBe("function");
    expect(typeof log.warn).toBe("function");
    expect(typeof log.error).toBe("function");
  });

  it("logs info messages at info level", () => {
    setLogLevel("info");
    const log = createLogger("mymod");
    log.info("hello world");
    expect(consoleSpy.log).toHaveBeenCalledOnce();
    const msg = consoleSpy.log.mock.calls[0][0] as string;
    expect(msg).toContain("[INFO ]");
    expect(msg).toContain("[mymod]");
    expect(msg).toContain("hello world");
  });

  it("suppresses debug messages at info level", () => {
    setLogLevel("info");
    const log = createLogger("mymod");
    log.debug("should not appear");
    expect(consoleSpy.debug).not.toHaveBeenCalled();
  });

  it("shows debug messages at debug level", () => {
    setLogLevel("debug");
    const log = createLogger("mymod");
    log.debug("visible");
    expect(consoleSpy.debug).toHaveBeenCalledOnce();
  });

  it("logs errors at all levels", () => {
    setLogLevel("error");
    const log = createLogger("mymod");
    log.error("critical failure");
    expect(consoleSpy.error).toHaveBeenCalledOnce();
  });

  it("suppresses info at error level", () => {
    setLogLevel("error");
    const log = createLogger("mymod");
    log.info("should not appear");
    expect(consoleSpy.log).not.toHaveBeenCalled();
  });
});
