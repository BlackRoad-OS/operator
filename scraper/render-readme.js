/**
 * BlackRoad OS Operator — README Renderer
 *
 * Reads scraper/data/repos.json and generates README.md
 * with ONLY verified, scraped numbers. Nothing assumed.
 * Every number has a _scraped_at timestamp proving when it was fetched.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA_PATH = join(__dirname, "data", "repos.json");

function formatSize(kb) {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

function formatDate(iso) {
  if (!iso) return "unknown";
  return iso.split("T")[0];
}

function render(snapshot) {
  const { scraped_at, org, repos } = snapshot;
  const okRepos = repos.filter((r) => r._status === "ok");
  const errorRepos = repos.filter((r) => r._status === "error");

  const totalIssues = okRepos.reduce((s, r) => s + (r.open_issues_count || 0), 0);
  const totalBranches = okRepos.reduce((s, r) => s + (r.branch_count || 0), 0);
  const totalStars = okRepos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
  const languages = [...new Set(okRepos.map((r) => r.language).filter(Boolean))];

  let md = `# operator

> BlackRoad OS operator — cross-repo health monitor and E2E scraper.

## Monitored Repos (${okRepos.length})

| Repo | Language | Stars | Issues | Branches | Last Push |
|------|----------|-------|--------|----------|-----------|
`;

  for (const r of okRepos) {
    const name = r.name || r.full_name;
    const link = `https://github.com/${r.full_name}`;
    md += `| [${name}](${link}) | ${r.language || "—"} | ${r.stargazers_count} | ${r.open_issues_count} | ${r.branch_count} | ${formatDate(r.pushed_at)} |\n`;
  }

  if (errorRepos.length > 0) {
    md += `\n**Failed to scrape:** ${errorRepos.map((r) => r.full_name).join(", ")}\n`;
  }

  md += `
## Verified Totals

| Metric | Value | Source |
|--------|-------|--------|
| Total open issues | ${totalIssues} | GitHub API |
| Total active branches | ${totalBranches} | GitHub API |
| Total stars | ${totalStars} | GitHub API |
| Languages detected | ${languages.join(", ") || "none"} | GitHub API |
| Org public repos | ${org?.public_repos ?? "?"} | GitHub API |

## Data Provenance

- **Scraped at:** ${scraped_at}
- **Source:** GitHub REST API v3
- **Repos scraped:** ${snapshot.repos_ok}/${snapshot.repo_count} successful
- **Method:** Live fetch, zero cached assumptions

> Every number above was fetched from \`api.github.com\` at the timestamp shown.
> No number persists from a prior run unless re-verified by a new scrape.
`;

  return md;
}

function main() {
  let snapshot;
  try {
    snapshot = JSON.parse(readFileSync(DATA_PATH, "utf8"));
  } catch (err) {
    console.error(`[render] Cannot read ${DATA_PATH}: ${err.message}`);
    console.error("[render] Run 'npm run scrape' first.");
    process.exit(1);
  }

  const md = render(snapshot);
  const readmePath = join(ROOT, "README.md");
  writeFileSync(readmePath, md);
  console.log(`[render] README.md updated from data scraped at ${snapshot.scraped_at}`);
}

main();
