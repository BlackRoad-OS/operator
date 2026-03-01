import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Report generator: reads ONLY verified data and produces
 * a README-safe metrics block.
 *
 * Nothing goes in the README unless it was verified in the
 * current scrape cycle. Yesterday's apple doesn't count today.
 */

const dataDir = join(process.cwd(), "data");
const verifiedPath = join(dataDir, "verified.json");

function main() {
  if (!existsSync(verifiedPath)) {
    console.error("[report] No verified data. Run `npm run scrape && npm run verify` first.");
    process.exit(1);
  }

  const verified = JSON.parse(readFileSync(verifiedPath, "utf-8"));
  const isLocal = verified.source === "local_git_proxy";

  if (verified.total_verified === 0) {
    console.log("[report] No verified repos. Nothing to report.");
    writeFileSync(join(dataDir, "readme-metrics.md"), "<!-- No verified metrics available -->\n");
    return;
  }

  const lines = [];
  lines.push("<!-- AUTO-GENERATED: Only verified data. Last update: " + verified.verified_at + " -->");
  lines.push("## Verified Repo Status");
  lines.push("");

  if (isLocal) {
    lines.push("| Repo | Branches | Tags | PRs | License | HEAD |");
    lines.push("|------|----------|------|-----|---------|------|");

    for (const repo of verified.repos) {
      const sha = repo.head_sha ? repo.head_sha.substring(0, 7) : "—";
      lines.push(
        `| ${repo.name} | ${repo.branches} | ${repo.tags} | ${repo.pull_requests} | ${repo.license ?? "—"} | ${sha} |`
      );
    }
  } else {
    lines.push("| Repo | Stars | Forks | Issues | Language | License | Last Push |");
    lines.push("|------|-------|-------|--------|----------|---------|-----------|");

    for (const repo of verified.repos) {
      const lastPush = repo.last_push ? repo.last_push.split("T")[0] : "—";
      lines.push(
        `| ${repo.name} | ${repo.stars} | ${repo.forks} | ${repo.open_issues} | ${repo.language ?? "—"} | ${repo.license ?? "—"} | ${lastPush} |`
      );
    }
  }

  lines.push("");
  lines.push(`> Source: ${verified.source} | Verified: ${verified.verified_at} | ${verified.total_verified} passed, ${verified.total_rejected} rejected`);

  if (verified.total_rejected > 0) {
    lines.push(">");
    lines.push("> Rejected (not shown): " + verified.rejected.map((r) => r.name).join(", "));
  }

  lines.push("");

  const metricsBlock = lines.join("\n");
  const outPath = join(dataDir, "readme-metrics.md");
  writeFileSync(outPath, metricsBlock);

  console.log("[report] Verified metrics block written to", outPath);
  console.log(metricsBlock);

  return metricsBlock;
}

main();
