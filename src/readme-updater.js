import fs from 'node:fs';
import path from 'node:path';
import { SCRAPE_RESULTS_FILE, E2E_RESULTS_FILE } from './config.js';

export function updateReadme() {
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

  const repoRows = verifiedRepos.map(r => {
    const m = r.data.metadata;
    const langBytes = r.data.languages || {};
    const totalBytes = Object.values(langBytes).reduce((a, b) => a + b, 0);
    const topLangs = Object.entries(langBytes)
      .sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([lang, bytes]) => `${lang} (${totalBytes > 0 ? ((bytes / totalBytes) * 100).toFixed(0) : 0}%)`)
      .join(', ');
    const lastCommit = r.data.recent_commits && r.data.recent_commits.length > 0
      ? r.data.recent_commits[0].date.split('T')[0] : 'N/A';
    return `| [${m.full_name}](https://github.com/${m.full_name}) | ${r.role} | ${topLangs || 'N/A'} | ${m.open_issues} | ${m.stars} | ${lastCommit} |`;
  });

  let e2eSection = '';
  if (e2eData && e2eData.summary) {
    const s = e2eData.summary;
    e2eSection = `\n## E2E Test Status\n\n| Metric | Value |\n|--------|-------|\n| Total tests | ${s.total} |\n| Passed | ${s.passed} |\n| Failed | ${s.failed} |\n| Pass rate | ${s.pass_rate} |\n| Last run | ${e2eData.completed_at} |\n`;
  }

  const readme = `# operator\n\nMulti-repo E2E testing, scraping, and health monitoring for BlackRoad OS.\n\n## Monitored Repositories\n\n> Every number below is scraped live from the GitHub API. Nothing fabricated.\n> Last verified: ${scraped_at}\n\n| Repository | Role | Languages | Open Issues | Stars | Last Commit |\n|------------|------|-----------|-------------|-------|-------------|\n${repoRows.join('\n')}\n\n## Aggregate (Verified Only)\n\n| Metric | Value | Source |\n|--------|-------|--------|\n| Repos scraped | ${summary.total_repos_scraped} | GitHub API |\n| Repos verified | ${summary.verified_repos} | Scraper validation |\n| Total open issues | ${summary.total_open_issues} | GitHub API (sum) |\n| Total stars | ${summary.total_stars} | GitHub API (sum) |\n| Total forks | ${summary.total_forks} | GitHub API (sum) |\n| Primary languages | ${summary.languages_detected.join(', ')} | GitHub API |\n| Topics | ${summary.all_topics.join(', ')} | GitHub API |\n| Most recent push | ${summary.last_push} | GitHub API |\n${e2eSection}\n`;

  fs.writeFileSync(path.join(process.cwd(), 'README.md'), readme);
  console.log(`[readme] Updated README.md with ${verifiedRepos.length} verified repos`);
}
