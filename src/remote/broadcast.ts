import { createLogger } from "../utils/logger.js";
import { mapConcurrent } from "../utils/concurrency.js";
import { getRepoContent, putRepoContent, type RepoInfo } from "../github/repos.js";
import { readFileSync } from "node:fs";

const log = createLogger("broadcast");

export interface BroadcastTarget {
  owner: string;
  repo: string;
  defaultBranch: string;
}

export interface BroadcastFile {
  path: string;
  content: string;
  commitMessage: string;
}

export interface BroadcastResult {
  target: BroadcastTarget;
  status: "created" | "updated" | "skipped" | "error";
  message: string;
}

export async function broadcastFile(
  targets: BroadcastTarget[],
  file: BroadcastFile,
  concurrency: number,
  dryRun = false
): Promise<BroadcastResult[]> {
  log.info(
    `Broadcasting ${file.path} to ${targets.length} repositories${dryRun ? " (dry run)" : ""}`
  );

  return mapConcurrent(targets, concurrency, async (target) => {
    const label = `${target.owner}/${target.repo}`;

    try {
      const existing = await getRepoContent(target.owner, target.repo, file.path);

      if (existing && existing.content === file.content) {
        log.debug(`[${label}] ${file.path} already up to date, skipping`);
        return { target, status: "skipped" as const, message: "Already up to date" };
      }

      if (dryRun) {
        const action = existing ? "Would update" : "Would create";
        log.info(`[${label}] ${action} ${file.path}`);
        return {
          target,
          status: (existing ? "updated" : "created") as "updated" | "created",
          message: `${action} (dry run)`,
        };
      }

      await putRepoContent(
        target.owner,
        target.repo,
        file.path,
        file.content,
        file.commitMessage,
        existing?.sha,
        target.defaultBranch
      );

      const action = existing ? "Updated" : "Created";
      log.info(`[${label}] ${action} ${file.path}`);
      return { target, status: (existing ? "updated" : "created") as "updated" | "created", message: action };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error(`[${label}] Failed to broadcast ${file.path}: ${msg}`);
      return { target, status: "error" as const, message: msg };
    }
  });
}

export async function broadcastLocalFile(
  targets: BroadcastTarget[],
  localPath: string,
  remotePath: string,
  commitMessage: string,
  concurrency: number,
  dryRun = false
): Promise<BroadcastResult[]> {
  const content = readFileSync(localPath, "utf-8");
  return broadcastFile(
    targets,
    { path: remotePath, content, commitMessage },
    concurrency,
    dryRun
  );
}

export function reposToTargets(repos: RepoInfo[]): BroadcastTarget[] {
  return repos
    .filter((r) => !r.archived && !r.disabled)
    .map((r) => ({
      owner: r.owner,
      name: r.name,
      repo: r.name,
      defaultBranch: r.defaultBranch,
    }));
}

export function summarizeResults(results: BroadcastResult[]): string {
  const created = results.filter((r) => r.status === "created").length;
  const updated = results.filter((r) => r.status === "updated").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const errors = results.filter((r) => r.status === "error").length;

  return [
    `Broadcast complete: ${results.length} targets`,
    `  created: ${created}`,
    `  updated: ${updated}`,
    `  skipped: ${skipped}`,
    `  errors:  ${errors}`,
  ].join("\n");
}
