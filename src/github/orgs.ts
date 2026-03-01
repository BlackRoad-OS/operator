import { getClient } from "./client.js";
import { createLogger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";

const log = createLogger("orgs");

export interface OrgInfo {
  login: string;
  id: number;
  description: string | null;
  reposUrl: string;
  totalRepos: number;
}

export async function discoverOrgs(): Promise<OrgInfo[]> {
  const client = getClient();
  log.info("Discovering all accessible organizations...");

  const orgs: OrgInfo[] = [];
  let page = 1;

  while (true) {
    const { data } = await withRetry(
      () => client.orgs.listForAuthenticatedUser({ per_page: 100, page }),
      `list orgs page ${page}`
    );

    if (data.length === 0) break;

    for (const org of data) {
      const detail = await withRetry(
        () => client.orgs.get({ org: org.login }),
        `get org ${org.login}`
      );

      orgs.push({
        login: org.login,
        id: org.id,
        description: org.description || null,
        reposUrl: org.repos_url,
        totalRepos: (detail.data.total_private_repos || 0) + detail.data.public_repos,
      });
    }

    page++;
  }

  log.info(`Discovered ${orgs.length} organizations`);
  return orgs;
}

export async function getOrgDetails(orgLogin: string): Promise<OrgInfo> {
  const client = getClient();
  const { data } = await withRetry(
    () => client.orgs.get({ org: orgLogin }),
    `get org ${orgLogin}`
  );

  return {
    login: data.login,
    id: data.id,
    description: data.description || null,
    reposUrl: data.repos_url,
    totalRepos: (data.total_private_repos || 0) + data.public_repos,
  };
}

export async function resolveOrgs(configured: string[]): Promise<OrgInfo[]> {
  if (configured.length > 0) {
    log.info(`Resolving ${configured.length} configured organizations...`);
    const orgs: OrgInfo[] = [];
    for (const orgLogin of configured) {
      try {
        orgs.push(await getOrgDetails(orgLogin));
      } catch (err) {
        log.error(`Failed to resolve org "${orgLogin}": ${err}`);
      }
    }
    return orgs;
  }

  return discoverOrgs();
}
