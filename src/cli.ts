import { loadConfig, loadState, saveState, type OperatorConfig, type OperatorState } from "./config.js";
import { initClient, getRateLimit, getAuthenticatedUser } from "./github/client.js";
import { resolveOrgs } from "./github/orgs.js";
import { listOrgRepos } from "./github/repos.js";
import { StreamEngine } from "./stream/engine.js";
import { createConsoleHandler } from "./stream/handlers.js";
import { scanAll, getOrgStatus } from "./remote/sync.js";
import {
  broadcastLocalFile,
  reposToTargets,
  summarizeResults,
} from "./remote/broadcast.js";
import { setLogLevel, createLogger } from "./utils/logger.js";

const log = createLogger("cli");

function printBanner(): void {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║          BLACKROAD OS  OPERATOR          ║
  ║     Remote Streaming Engine v0.1.0       ║
  ╚══════════════════════════════════════════╝
`);
}

function printUsage(): void {
  console.log(`Usage: operator <command> [options]

Commands:
  scan                  Discover all orgs and repos, build manifest
  stream                Stream live events from all organizations
  status [org]          Show status of repos (optionally for specific org)
  broadcast <file> <remote-path> <message>
                        Push a file to all repos across all orgs
  rate-limit            Check GitHub API rate limit
  help                  Show this help message

Options:
  --dry-run             Preview broadcast without making changes
  --org <name>          Target a specific organization
  --concurrency <n>     Max concurrent API calls (default: 10)
  --interval <ms>       Stream polling interval in ms (default: 30000)
  --json                Output in JSON format

Environment:
  GITHUB_TOKEN          GitHub personal access token (required)
  OPERATOR_ORGS         Comma-separated org list (auto-discover if empty)
  OPERATOR_LOG_LEVEL    debug | info | warn | error
`);
}

function parseArgs(argv: string[]): { command: string; args: string[]; flags: Record<string, string | boolean> } {
  const command = argv[0] || "help";
  const args: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      args.push(arg);
    }
  }

  return { command, args, flags };
}

async function cmdScan(config: OperatorConfig, state: OperatorState): Promise<void> {
  log.info("Scanning all organizations and repositories...");
  const manifest = await scanAll(config, state);

  console.log(`\n  Scan Results`);
  console.log(`  ${"─".repeat(50)}`);
  console.log(`  Organizations:  ${manifest.totalOrgs}`);
  console.log(`  Repositories:   ${manifest.totalRepos}`);
  console.log(`  Scanned at:     ${manifest.scannedAt}`);
  console.log();

  for (const orgSync of manifest.orgs) {
    const o = orgSync.org;
    const active = orgSync.repos.filter((r) => !r.archived).length;
    const archived = orgSync.repos.filter((r) => r.archived).length;
    const forks = orgSync.repos.filter((r) => r.fork).length;

    console.log(`  ${o.login}`);
    console.log(`    Total: ${orgSync.repos.length}  Active: ${active}  Archived: ${archived}  Forks: ${forks}`);
  }
  console.log();
}

async function cmdStream(
  config: OperatorConfig,
  state: OperatorState,
  flags: Record<string, string | boolean>
): Promise<void> {
  const orgs = await resolveOrgs(config.orgs);
  const orgLogins = orgs.map((o) => o.login);

  if (flags.interval) {
    config.stream.interval = parseInt(flags.interval as string, 10);
  }

  console.log(`  Streaming events from ${orgLogins.length} organizations`);
  console.log(`  Organizations: ${orgLogins.join(", ")}`);
  console.log(`  Poll interval: ${config.stream.interval}ms`);
  console.log(`  Press Ctrl+C to stop\n`);

  const engine = new StreamEngine(config, state, orgLogins);
  const handler = createConsoleHandler();
  engine.on("stream", handler);

  process.on("SIGINT", () => {
    log.info("Shutting down...");
    engine.stop();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    engine.stop();
    process.exit(0);
  });

  await engine.start();

  // Keep process alive
  await new Promise(() => {});
}

async function cmdStatus(
  config: OperatorConfig,
  args: string[],
  flags: Record<string, string | boolean>
): Promise<void> {
  const targetOrg = (flags.org as string) || args[0];
  const orgs = targetOrg ? [{ login: targetOrg }] : (await resolveOrgs(config.orgs)).map((o) => ({ login: o.login }));

  for (const org of orgs) {
    console.log(`\n  ${org.login}`);
    console.log(`  ${"─".repeat(60)}`);

    const statuses = await getOrgStatus(org.login, config.concurrency);

    if (flags.json) {
      console.log(JSON.stringify(statuses, null, 2));
      continue;
    }

    for (const s of statuses) {
      const commit = s.latestCommit;
      const lang = s.repo.language || "—";
      const vis = s.repo.private ? "private" : "public";
      const status = s.repo.archived ? " [archived]" : "";
      const commitInfo = commit
        ? `${commit.sha.slice(0, 7)} ${commit.message.split("\n")[0].slice(0, 40)}`
        : "no commits";

      console.log(`    ${s.repo.name.padEnd(35)} ${lang.padEnd(12)} ${vis.padEnd(8)} ${commitInfo}${status}`);
    }
  }
  console.log();
}

async function cmdBroadcast(
  config: OperatorConfig,
  state: OperatorState,
  args: string[],
  flags: Record<string, string | boolean>
): Promise<void> {
  const [localPath, remotePath, ...messageParts] = args;
  const commitMessage = messageParts.join(" ");

  if (!localPath || !remotePath || !commitMessage) {
    console.error("Usage: operator broadcast <local-file> <remote-path> <commit-message>");
    process.exit(1);
  }

  const dryRun = !!flags["dry-run"];
  const targetOrg = flags.org as string | undefined;

  log.info(`Broadcasting ${localPath} -> ${remotePath}`);
  if (dryRun) log.info("DRY RUN — no changes will be made");

  const orgs = targetOrg ? [targetOrg] : (await resolveOrgs(config.orgs)).map((o) => o.login);
  const allResults = [];

  for (const org of orgs) {
    log.info(`Processing ${org}...`);
    const repos = await listOrgRepos(org);
    const targets = reposToTargets(repos);

    const results = await broadcastLocalFile(
      targets,
      localPath,
      remotePath,
      commitMessage,
      config.concurrency,
      dryRun
    );

    allResults.push(...results);
    console.log(`  [${org}] ${summarizeResults(results)}`);
  }

  console.log(`\n  Total: ${summarizeResults(allResults)}`);
}

async function cmdRateLimit(): Promise<void> {
  const limit = await getRateLimit();
  const pct = ((limit.remaining / limit.limit) * 100).toFixed(1);

  console.log(`\n  GitHub API Rate Limit`);
  console.log(`  ${"─".repeat(30)}`);
  console.log(`  Limit:     ${limit.limit}`);
  console.log(`  Used:      ${limit.used}`);
  console.log(`  Remaining: ${limit.remaining} (${pct}%)`);
  console.log(`  Resets at: ${limit.reset.toISOString()}`);
  console.log();
}

async function main(): Promise<void> {
  const { command, args, flags } = parseArgs(process.argv.slice(2));

  if (command === "help" || flags.help) {
    printBanner();
    printUsage();
    return;
  }

  printBanner();

  const config = loadConfig();
  setLogLevel(config.logLevel);
  initClient(config.token);

  const user = await getAuthenticatedUser();
  log.info(`Authenticated as ${user.login}`);

  const state = loadState(config.dataDir);

  switch (command) {
    case "scan":
      await cmdScan(config, state);
      break;
    case "stream":
      await cmdStream(config, state, flags);
      break;
    case "status":
      await cmdStatus(config, args, flags);
      break;
    case "broadcast":
      await cmdBroadcast(config, state, args, flags);
      break;
    case "rate-limit":
      await cmdRateLimit();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

main().catch((err) => {
  log.error(`Fatal: ${err.message || err}`);
  process.exit(1);
});
