import { Octokit } from "@octokit/rest";
import { createLogger } from "../utils/logger.js";

const log = createLogger("github");

let _client: Octokit | null = null;

export function initClient(token: string): Octokit {
  _client = new Octokit({
    auth: token,
    userAgent: "blackroad-operator/0.1.0",
    log: {
      debug: (msg: string) => log.debug(msg),
      info: (msg: string) => log.info(msg),
      warn: (msg: string) => log.warn(msg),
      error: (msg: string) => log.error(msg),
    },
  });
  return _client;
}

export function getClient(): Octokit {
  if (!_client) throw new Error("GitHub client not initialized. Call initClient() first.");
  return _client;
}

export interface RateLimit {
  limit: number;
  remaining: number;
  reset: Date;
  used: number;
}

export async function getRateLimit(): Promise<RateLimit> {
  const client = getClient();
  const { data } = await client.rateLimit.get();
  return {
    limit: data.rate.limit,
    remaining: data.rate.remaining,
    reset: new Date(data.rate.reset * 1000),
    used: data.rate.used,
  };
}

export async function getAuthenticatedUser(): Promise<{ login: string; id: number }> {
  const client = getClient();
  const { data } = await client.users.getAuthenticated();
  return { login: data.login, id: data.id };
}
