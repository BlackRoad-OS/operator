import { describe, it, expect, vi, afterEach } from "vitest";
import { createConsoleHandler, createFilterHandler } from "../../src/stream/handlers.js";
import type { StreamEvent } from "../../src/stream/engine.js";

describe("stream handlers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createConsoleHandler", () => {
    it("handles start events", () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const handler = createConsoleHandler();

      const event: StreamEvent = {
        type: "start",
        org: "*",
        data: null,
        timestamp: new Date().toISOString(),
      };

      handler(event);
      expect(logSpy).toHaveBeenCalled();
    });

    it("handles GitHub events", () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const handler = createConsoleHandler();

      const event: StreamEvent = {
        type: "event",
        org: "BlackRoad-OS",
        data: {
          id: "123",
          type: "PushEvent",
          actor: "user1",
          repo: "BlackRoad-OS/operator",
          action: null,
          createdAt: new Date().toISOString(),
          payload: {},
        },
        timestamp: new Date().toISOString(),
      };

      handler(event);
      expect(logSpy).toHaveBeenCalled();
    });
  });

  describe("createFilterHandler", () => {
    it("passes matching event types", () => {
      const inner = vi.fn();
      const handler = createFilterHandler(["PushEvent"], inner);

      const event: StreamEvent = {
        type: "event",
        org: "test",
        data: {
          id: "1",
          type: "PushEvent",
          actor: "user",
          repo: "test/repo",
          action: null,
          createdAt: new Date().toISOString(),
          payload: {},
        },
        timestamp: new Date().toISOString(),
      };

      handler(event);
      expect(inner).toHaveBeenCalledWith(event);
    });

    it("filters out non-matching event types", () => {
      const inner = vi.fn();
      const handler = createFilterHandler(["PushEvent"], inner);

      const event: StreamEvent = {
        type: "event",
        org: "test",
        data: {
          id: "1",
          type: "IssuesEvent",
          actor: "user",
          repo: "test/repo",
          action: "opened",
          createdAt: new Date().toISOString(),
          payload: {},
        },
        timestamp: new Date().toISOString(),
      };

      handler(event);
      expect(inner).not.toHaveBeenCalled();
    });

    it("always passes non-event stream types", () => {
      const inner = vi.fn();
      const handler = createFilterHandler(["PushEvent"], inner);

      const event: StreamEvent = {
        type: "start",
        org: "*",
        data: null,
        timestamp: new Date().toISOString(),
      };

      handler(event);
      expect(inner).toHaveBeenCalledWith(event);
    });
  });
});
