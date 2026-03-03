// @blackroad/operator — Centralized Remote Streaming Engine
// BlackRoad OS, Inc.

export { loadConfig, loadState, saveState } from "./config.js";
export type { OperatorConfig, OperatorState } from "./config.js";

export { initClient, getClient, getRateLimit, getAuthenticatedUser } from "./github/client.js";
export { discoverOrgs, resolveOrgs, getOrgDetails } from "./github/orgs.js";
export type { OrgInfo } from "./github/orgs.js";
export {
  listOrgRepos,
  getRepo,
  getRepoContent,
  putRepoContent,
  listBranches,
  getLatestCommit,
} from "./github/repos.js";
export type { RepoInfo, RepoBranch } from "./github/repos.js";
export { listOrgEvents, listRepoEvents, pollOrgEvents } from "./github/events.js";
export type { OrgEvent } from "./github/events.js";

export { StreamEngine } from "./stream/engine.js";
export type { StreamEvent, StreamEventType } from "./stream/engine.js";
export { createConsoleHandler, createFilterHandler, createJsonHandler } from "./stream/handlers.js";

export { scanAll, getOrgStatus } from "./remote/sync.js";
export type { SyncManifest, OrgSyncInfo } from "./remote/sync.js";
export {
  broadcastFile,
  broadcastLocalFile,
  reposToTargets,
  summarizeResults,
} from "./remote/broadcast.js";
export type { BroadcastTarget, BroadcastFile, BroadcastResult } from "./remote/broadcast.js";

export { createLogger, setLogLevel } from "./utils/logger.js";
export { withRetry } from "./utils/retry.js";
export { mapConcurrent } from "./utils/concurrency.js";

export { verifyLicense, loadLicenseKey, requireLicense, isValidKeyFormat } from "./licensing/verify.js";
export type { LicenseInfo } from "./licensing/verify.js";
