import { createLogger } from "../utils/logger.js";
import type { StreamEvent } from "./engine.js";
import type { OrgEvent } from "../github/events.js";

const log = createLogger("handlers");

export type EventHandler = (event: StreamEvent) => void | Promise<void>;

const EVENT_ICONS: Record<string, string> = {
  PushEvent: ">>",
  CreateEvent: "++",
  DeleteEvent: "--",
  PullRequestEvent: "<>",
  IssuesEvent: "!!",
  IssueCommentEvent: "//",
  WatchEvent: "**",
  ForkEvent: "~~",
  ReleaseEvent: "##",
  PublicEvent: "@@",
};

export function createConsoleHandler(): EventHandler {
  return (streamEvent: StreamEvent) => {
    if (streamEvent.type === "event" && streamEvent.data && "type" in streamEvent.data) {
      const event = streamEvent.data as OrgEvent;
      const icon = EVENT_ICONS[event.type] || "..";
      const action = event.action ? ` (${event.action})` : "";
      log.info(
        `${icon} [${streamEvent.org}] ${event.type}${action} on ${event.repo} by ${event.actor}`
      );
    } else if (streamEvent.type === "cycle") {
      const events = streamEvent.data as OrgEvent[];
      if (events.length === 0) {
        log.debug(`[${streamEvent.org}] No new events`);
      }
    } else if (streamEvent.type === "start") {
      log.info("Stream started — listening for events across all organizations");
    } else if (streamEvent.type === "stop") {
      log.info("Stream stopped");
    } else if (streamEvent.type === "error") {
      log.error(`Stream error on ${streamEvent.org}: ${streamEvent.data}`);
    }
  };
}

export function createFilterHandler(
  eventTypes: string[],
  inner: EventHandler
): EventHandler {
  const types = new Set(eventTypes);
  return (streamEvent: StreamEvent) => {
    if (streamEvent.type !== "event") return inner(streamEvent);
    if (streamEvent.data && "type" in streamEvent.data) {
      const event = streamEvent.data as OrgEvent;
      if (types.has(event.type)) return inner(streamEvent);
    }
  };
}

export function createJsonHandler(stream: NodeJS.WritableStream): EventHandler {
  return (event: StreamEvent) => {
    if (event.type === "event") {
      stream.write(JSON.stringify(event) + "\n");
    }
  };
}
