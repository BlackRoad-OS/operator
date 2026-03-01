import { getClient } from "./client.js";
import { createLogger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";

const log = createLogger("repos");

export interface RepoInfo {
  owner: string;
  name: string;
  fullName: string;
  id: number;
  private: boolean;
  defaultBranch: string;
  cloneUrl: string;
  sshUrl: string;
  language: string | null;
  size: number;
  updatedAt: string;
  pushedAt: string | null;
  archived: boolean;
  disabled: boolean;
  fork: boolean;
  topics: string[];
}

function mapRepo(data: any): RepoInfo {
  return {
    owner: data.owner.login,
    name: data.name,
    fullName: data.full_name,
    id: data.id,
    private: data.private,
    defaultBranch: data.default_branch,
    cloneUrl: data.clone_url,
    sshUrl: data.ssh_url,
    language: data.language,
    size: data.size,
    updatedAt: data.updated_at,
    pushedAt: data.pushed_at,
    archived: data.archived,
    disabled: data.disabled,
    fork: data.fork,
    topics: data.topics || [],
  };
}

export async function listOrgRepos(org: string): Promise<RepoInfo[]> {
  const client = getClient();
  log.info(`Listing all repositories for ${org}...`);

  const repos: RepoInfo[] = [];
  let page = 1;

  while (true) {
    const { data } = await withRetry(
      () => client.repos.listForOrg({ org, per_page: 100, page, type: "all", sort: "pushed" }),
      `list repos for ${org} page ${page}`
    );

    if (data.length === 0) break;
    repos.push(...data.map(mapRepo));
    if (data.length < 100) break;
    page++;
  }

  log.info(`Found ${repos.length} repositories in ${org}`);
  return repos;
}

export async function getRepo(owner: string, repo: string): Promise<RepoInfo> {
  const client = getClient();
  const { data } = await withRetry(
    () => client.repos.get({ owner, repo }),
    `get repo ${owner}/${repo}`
  );
  return mapRepo(data);
}

export async function getRepoContent(
  owner: string,
  repo: string,
  path: string,
  ref?: string
): Promise<{ content: string; sha: string } | null> {
  const client = getClient();
  try {
    const { data } = await client.repos.getContent({
      owner,
      repo,
      path,
      ...(ref ? { ref } : {}),
    });
    if ("content" in data && data.type === "file") {
      return {
        content: Buffer.from(data.content, "base64").toString("utf-8"),
        sha: data.sha,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function putRepoContent(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  sha?: string,
  branch?: string
): Promise<void> {
  const client = getClient();
  await withRetry(
    () =>
      client.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: Buffer.from(content).toString("base64"),
        ...(sha ? { sha } : {}),
        ...(branch ? { branch } : {}),
      }),
    `put content ${owner}/${repo}/${path}`
  );
}

export interface RepoBranch {
  name: string;
  sha: string;
  protected: boolean;
}

export async function listBranches(owner: string, repo: string): Promise<RepoBranch[]> {
  const client = getClient();
  const branches: RepoBranch[] = [];
  let page = 1;

  while (true) {
    const { data } = await withRetry(
      () => client.repos.listBranches({ owner, repo, per_page: 100, page }),
      `list branches ${owner}/${repo} page ${page}`
    );
    if (data.length === 0) break;
    branches.push(...data.map((b) => ({ name: b.name, sha: b.commit.sha, protected: b.protected })));
    if (data.length < 100) break;
    page++;
  }

  return branches;
}

export async function getLatestCommit(
  owner: string,
  repo: string,
  branch?: string
): Promise<{ sha: string; message: string; date: string; author: string } | null> {
  const client = getClient();
  try {
    const { data } = await client.repos.listCommits({
      owner,
      repo,
      per_page: 1,
      ...(branch ? { sha: branch } : {}),
    });
    if (data.length === 0) return null;
    const c = data[0];
    return {
      sha: c.sha,
      message: c.commit.message,
      date: c.commit.committer?.date || c.commit.author?.date || "",
      author: c.commit.author?.name || c.author?.login || "unknown",
    };
  } catch {
    return null;
  }
}
