import fs from 'node:fs';
import path from 'node:path';
import { SCRAPE_RESULTS_FILE, E2E_RESULTS_FILE } from './config.js';

/**
 * Update README.md with ONLY verified, scraped numbers.
 * Rule: if the scraper didn't verify it, it doesn't appear.
 * No "yesterday's apple" — every number traces to a live API call.
 */
function updateReadme() {
  if (!fs.existsSync(SCRAPE_RESULTS_FILE)) {
    console.error('[readme] No scrape results found. Run scraper first.');
    process.exit(1);
  }

  const scrapeData = JSON.parse(fs.readFileSync(SCRAPE_RESULTS_FILE, 'utf8'));
  const verifiedRepos = scrapeData.repos.filter(r => r.verified);

  if (verifiedRepos.length === 0) {
    console.error('[readme] No verified repos. Cannot update README with unverified data.');
    process.exit(1);
  }

  let e2eData = null;
  if (fs.existsSync(E2E_RESULTS_FILE)) {
    e2eData = JSON.parse(fs.readFileSync(E2E_RESULTS_FILE, 'utf8'));
  }

  const summary = scrapeData.summary;
  const scraped_at = scrapeData.completed_at;

  // Build repo table — only verified data
  const repoRows = verifiedRepos.map(r => {
    const m = r.data.metadata;
    const langBytes = r.data.languages || {};
    const totalBytes = Object.values(langBytes).reduce((a, b) => a + b, 0);
    const topLangs = Object.entries(langBytes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([lang, bytes]) => `${lang} (${totalBytes > 0 ? ((bytes / totalBytes) * 100).toFixed(0) : 0}%)`)
      .join(', ');

    const lastCommit = r.data.recent_commits && r.data.recent_commits.length > 0
      ? r.data.recent_commits[0].date.split('T')[0]
      : 'N/A';

    return `| [${m.full_name}](https://github.com/${m.full_name}) | ${r.role} | ${topLangs || 'N/A'} | ${m.open_issues} | ${m.stars} | ${lastCommit} |`;
  });

  // Build E2E status section
  let e2eSection = '';
  if (e2eData && e2eData.summary) {
    const s = e2eData.summary;
    e2eSection = `
## E2E Test Status

| Metric | Value |
|--------|-------|
| Total tests | ${s.total} |
| Passed | ${s.passed} |
| Failed | ${s.failed} |
| Pass rate | ${s.pass_rate} |
| Last run | ${e2eData.completed_at} |
`;
    if (e2eData.recovery_steps && e2eData.recovery_steps.length > 0) {
      // Deduplicate recovery steps by action text
      const seen = new Set();
      const unique = e2eData.recovery_steps.filter(s => {
        if (seen.has(s.action)) return false;
        seen.add(s.action);
        return true;
      });
      e2eSection += `\n### Recovery Steps Needed\n\n`;
      for (const step of unique) {
        e2eSection += `- **[${step.severity}]** ${step.action}\n`;
      }
    }
  }

  const readme = `# operator

Multi-repo E2E testing, scraping, and health monitoring for BlackRoad OS.

## Monitored Repositories

> Every number below is scraped live from the GitHub API. Nothing fabricated.
> Last verified: ${scraped_at}

| Repository | Role | Languages | Open Issues | Stars | Last Commit |
|------------|------|-----------|-------------|-------|-------------|
${repoRows.join('\n')}

## Aggregate (Verified Only)

| Metric | Value | Source |
|--------|-------|--------|
| Repos scraped | ${summary.total_repos_scraped} | GitHub API |
| Repos verified | ${summary.verified_repos} | Scraper validation |
| Total open issues | ${summary.total_open_issues} | GitHub API (sum) |
| Total stars | ${summary.total_stars} | GitHub API (sum) |
| Total forks | ${summary.total_forks} | GitHub API (sum) |
| Primary languages | ${summary.languages_detected.join(', ')} | GitHub API |
| Topics | ${summary.all_topics.join(', ')} | GitHub API |
| Most recent push | ${summary.last_push} | GitHub API |
${e2eSection}
## How It Works

1. **Scraper** (\`src/scraper.js\`) — Hits GitHub API for each repo. Pulls metadata, languages, commits, issues, PRs, contributors.
2. **E2E Runner** (\`src/e2e-runner.js\`) — 30+ assertions against live data. Validates every repo is reachable, active, not archived, data is consistent.
3. **README Updater** (\`src/readme-updater.js\`) — Rebuilds this file from verified scrape data only. Unverified repos are excluded.
4. **Automation** (\`src/automation.js\`) — Orchestrates scrape -> test -> update -> report. Failure recovery built in.

## Commands

\`\`\`bash
npm run scrape        # Scrape all 5 repos
npm test              # Run E2E tests (scrapes first)
npm run update-readme # Update this file from verified data
npm run full          # Full pipeline: scrape -> test -> update readme
\`\`\`
`;

  fs.writeFileSync(path.join(process.cwd(), 'README.md'), readme);
  console.log(`[readme] Updated README.md with ${verifiedRepos.length} verified repos`);
  console.log(`[readme] Data sourced from scrape at ${scraped_at}`);
}

if (process.argv[1]?.endsWith('readme-updater.js')) {
  updateReadme();
}

export { updateReadme };
