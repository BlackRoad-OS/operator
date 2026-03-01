import { getClient } from "./client.js";
import { createLogger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";

const log = createLogger("events");

export interface OrgEvent {
  id: string;
  type: string;
  actor: string;
  repo: string;
  action: string | null;
  createdAt: string;
  payload: Record<string, unknown>;
}

function mapEvent(data: any): OrgEvent {
  return {
    id: data.id,
    type: data.type || "Unknown",
    actor: data.actor?.login || "unknown",
    repo: data.repo?.name || "unknown",
    action: data.payload?.action || null,
    createdAt: data.created_at,
    payload: data.payload || {},
  };
}

export async function listOrgEvents(
  org: string,
  perPage = 100
): Promise<OrgEvent[]> {
  const client = getClient();
  log.debug(`Fetching events for ${org}...`);

  const { data } = await withRetry(
    () => client.activity.listPublicOrgEvents({ org, per_page: perPage }),
    `list events for ${org}`
  );

  return data.map(mapEvent);
}

export async function listRepoEvents(
  owner: string,
  repo: string,
  perPage = 30
): Promise<OrgEvent[]> {
  const client = getClient();

  const { data } = await withRetry(
    () => client.activity.listRepoEvents({ owner, repo, per_page: perPage }),
    `list events for ${owner}/${repo}`
  );

  return data.map(mapEvent);
}

export async function pollOrgEvents(
  org: string,
  since: string | null,
  perPage = 100
): Promise<{ events: OrgEvent[]; cursor: string | null }> {
  const events = await listOrgEvents(org, perPage);

  if (!since) {
    const cursor = events.length > 0 ? events[0].id : null;
    return { events, cursor };
  }

  const newEvents: OrgEvent[] = [];
  for (const event of events) {
    if (event.id === since) break;
    newEvents.push(event);
  }

  const cursor = newEvents.length > 0 ? newEvents[0].id : since;
  return { events: newEvents, cursor };
}
