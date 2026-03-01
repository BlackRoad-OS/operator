import { EventEmitter } from "node:events";
import { createLogger } from "../utils/logger.js";
import { pollOrgEvents, type OrgEvent } from "../github/events.js";
import type { OperatorConfig, OperatorState } from "../config.js";
import { saveState } from "../config.js";

const log = createLogger("stream");

export type StreamEventType =
  | "event"       // GitHub event received
  | "cycle"       // Polling cycle completed
  | "error"       // Error during polling
  | "start"       // Stream started
  | "stop";       // Stream stopped

export interface StreamEvent {
  type: StreamEventType;
  org: string;
  data: OrgEvent | OrgEvent[] | Error | null;
  timestamp: string;
}

export class StreamEngine extends EventEmitter {
  private running = false;
  private timers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private config: OperatorConfig;
  private state: OperatorState;
  private orgs: string[];

  constructor(config: OperatorConfig, state: OperatorState, orgs: string[]) {
    super();
    this.config = config;
    this.state = state;
    this.orgs = orgs;
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    log.info(`Starting stream engine for ${this.orgs.length} organizations`);
    log.info(`Poll interval: ${this.config.stream.interval}ms`);

    this.emit("stream", {
      type: "start",
      org: "*",
      data: null,
      timestamp: new Date().toISOString(),
    } satisfies StreamEvent);

    // Initial poll for all orgs
    await this.pollAll();

    // Set up recurring polls
    for (const org of this.orgs) {
      const timer = setInterval(() => this.pollOrg(org), this.config.stream.interval);
      this.timers.set(org, timer);
    }
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;

    for (const [org, timer] of this.timers) {
      clearInterval(timer);
      this.timers.delete(org);
    }

    log.info("Stream engine stopped");
    this.emit("stream", {
      type: "stop",
      org: "*",
      data: null,
      timestamp: new Date().toISOString(),
    } satisfies StreamEvent);
  }

  private async pollAll(): Promise<void> {
    log.info("Running initial poll across all organizations...");
    for (const org of this.orgs) {
      await this.pollOrg(org);
    }
  }

  private async pollOrg(org: string): Promise<void> {
    try {
      const cursor = this.state.streamCursor[org] || null;
      const result = await pollOrgEvents(org, cursor);

      if (result.cursor) {
        this.state.streamCursor[org] = result.cursor;
        saveState(this.config.dataDir, this.state);
      }

      if (result.events.length > 0) {
        log.info(`[${org}] ${result.events.length} new events`);

        for (const event of result.events) {
          this.emit("stream", {
            type: "event",
            org,
            data: event,
            timestamp: new Date().toISOString(),
          } satisfies StreamEvent);
        }
      }

      this.emit("stream", {
        type: "cycle",
        org,
        data: result.events,
        timestamp: new Date().toISOString(),
      } satisfies StreamEvent);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      log.error(`[${org}] Poll error: ${error.message}`);
      this.emit("stream", {
        type: "error",
        org,
        data: error,
        timestamp: new Date().toISOString(),
      } satisfies StreamEvent);
    }
  }

  isRunning(): boolean {
    return this.running;
  }
}
