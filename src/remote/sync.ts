import { createLogger } from "../utils/logger.js";
import { mapConcurrent } from "../utils/concurrency.js";
import { listOrgRepos, type RepoInfo, getLatestCommit } from "../github/repos.js";
import { resolveOrgs, type OrgInfo } from "../github/orgs.js";
import type { OperatorConfig, OperatorState } from "../config.js";
import { saveState } from "../config.js";

const log = createLogger("sync");

export interface SyncManifest {
  orgs: OrgSyncInfo[];
  totalRepos: number;
  totalOrgs: number;
  scannedAt: string;
}

export interface OrgSyncInfo {
  org: OrgInfo;
  repos: RepoInfo[];
}

export async function scanAll(config: OperatorConfig, state: OperatorState): Promise<SyncManifest> {
  log.info("Starting full scan across all organizations...");

  const orgs = await resolveOrgs(config.orgs);
  const orgSyncs: OrgSyncInfo[] = [];
  let totalRepos = 0;

  for (const org of orgs) {
    log.info(`Scanning ${org.login} (${org.totalRepos} repos)...`);
    const repos = await listOrgRepos(org.login);
    orgSyncs.push({ org, repos });
    totalRepos += repos.length;

    state.orgs[org.login] = {
      repoCount: repos.length,
      lastSync: new Date().toISOString(),
    };
  }

  state.lastScan = new Date().toISOString();
  saveState(config.dataDir, state);

  const manifest: SyncManifest = {
    orgs: orgSyncs,
    totalRepos,
    totalOrgs: orgs.length,
    scannedAt: new Date().toISOString(),
  };

  log.info(`Scan complete: ${manifest.totalOrgs} orgs, ${manifest.totalRepos} repos`);
  return manifest;
}

export interface RepoStatus {
  repo: RepoInfo;
  latestCommit: { sha: string; message: string; date: string; author: string } | null;
}

export async function getOrgStatus(
  orgLogin: string,
  concurrency: number
): Promise<RepoStatus[]> {
  const repos = await listOrgRepos(orgLogin);

  const statuses = await mapConcurrent(repos, concurrency, async (repo) => {
    const latestCommit = await getLatestCommit(repo.owner, repo.name, repo.defaultBranch);
    return { repo, latestCommit };
  });

  return statuses;
}
