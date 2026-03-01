import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ORG, REPOS, OUTPUT_DIR } from "./config.js";
import { scrapeRepo } from "./fetch.js";
import { scrapeRepoLocal } from "./local.js";

const dataDir = join(process.cwd(), OUTPUT_DIR);
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

async function main() {
  console.log(`[operator] Scraping ${REPOS.length} repos from ${ORG}...`);
  const startTime = Date.now();

  // Try GitHub API first; fall back to local git proxy
  let useLocal = false;
  const firstResult = await scrapeRepo(ORG, REPOS[0].name);
  if (!firstResult.reachable) {
    console.log("[operator] GitHub API unreachable — switching to local git proxy");
    useLocal = true;
  }

  const scraped = [];
  const failures = [];

  if (useLocal) {
    for (const repo of REPOS) {
      try {
        const result = await scrapeRepoLocal(ORG, repo.name);
        scraped.push(result);
        const icon = result.reachable ? "+" : "!";
        console.log(`  [${icon}] ${repo.name}: ${result.reachable ? "OK" : result.error}`);
      } catch (err) {
        failures.push({ name: repo.name, error: err.message });
        console.log(`  [x] ${repo.name}: FAILED (${err.message})`);
      }
    }
  } else {
    // GitHub API path
    scraped.push(firstResult);
    console.log(`  [+] ${REPOS[0].name}: OK`);

    const remaining = await Promise.allSettled(
      REPOS.slice(1).map((repo) => scrapeRepo(ORG, repo.name))
    );
    for (let i = 0; i < remaining.length; i++) {
      const result = remaining[i];
      const repo = REPOS[i + 1];
      if (result.status === "fulfilled" && result.value) {
        scraped.push(result.value);
        const icon = result.value.reachable ? "+" : "!";
        console.log(`  [${icon}] ${repo.name}: ${result.value.reachable ? "OK" : result.value.error}`);
      } else {
        failures.push({ name: repo.name, error: result.reason?.message ?? "unknown" });
        console.log(`  [x] ${repo.name}: FAILED`);
      }
    }
  }

  const elapsed = Date.now() - startTime;

  const report = {
    org: ORG,
    source: useLocal ? "local_git_proxy" : "github_api",
    scraped_at: new Date().toISOString(),
    elapsed_ms: elapsed,
    total: REPOS.length,
    reachable: scraped.filter((s) => s.reachable).length,
    unreachable: scraped.filter((s) => !s.reachable).length,
    failed: failures.length,
    repos: scraped,
    failures,
  };

  const outPath = join(dataDir, "scrape-results.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\n[operator] Results written to ${outPath}`);
  console.log(`[operator] ${report.reachable}/${report.total} reachable in ${elapsed}ms`);
  console.log(`[operator] Source: ${report.source}`);

  // Write individual repo files
  for (const repo of scraped) {
    const repoPath = join(dataDir, `${repo.name}.json`);
    writeFileSync(repoPath, JSON.stringify(repo, null, 2));
  }

  // Write timestamp for real-time tracking
  writeFileSync(
    join(dataDir, "last-run.json"),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      source: report.source,
      elapsed_ms: elapsed,
      reachable: report.reachable,
      total: report.total,
    }, null, 2)
  );

  return report;
}

main().catch((err) => {
  console.error("[operator] Fatal scraper error:", err.message);
  process.exit(1);
});
