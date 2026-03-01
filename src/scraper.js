const { execSync } = require('child_process');
const fs = require('fs');
const { REPOS, GITHUB_API, DATA_DIR, SCRAPE_RESULTS_FILE } = require('./config');

/**
 * Fetch JSON from GitHub API via curl (respects system proxy).
 * Retries up to 3 times with exponential backoff on failure.
 */
function fetchJSON(url) {
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const cmd = `curl -sf -H "Accept: application/vnd.github.v3+json" --max-time 15 "${url}"`;
      const raw = execSync(cmd, { encoding: 'utf8', timeout: 20000 });
      return JSON.parse(raw);
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const delay = Math.pow(2, attempt) * 500;
      execSync(`sleep ${delay / 1000}`);
    }
  }
}

/**
 * Check if a URL returns 2xx via curl.
 */
function urlExists(url) {
  try {
    execSync(`curl -sf --head --max-time 10 "${url}"`, { encoding: 'utf8', timeout: 15000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Scrape verified data from GitHub API for a single repo.
 * Every number returned is pulled live — nothing fabricated.
 */
async function scrapeRepo(repo) {
  const slug = `${repo.owner}/${repo.name}`;

  const results = {
    slug,
    role: repo.role,
    scraped_at: new Date().toISOString(),
    verified: true,
    data: {},
    errors: [],
  };

  // Repo metadata
  try {
    const data = fetchJSON(`${GITHUB_API}/repos/${slug}`);
    results.data.metadata = {
      full_name: data.full_name,
      description: data.description,
      language: data.language,
      size_kb: data.size,
      stars: data.stargazers_count,
      forks: data.forks_count,
      open_issues: data.open_issues_count,
      watchers: data.watchers_count,
      default_branch: data.default_branch,
      created_at: data.created_at,
      updated_at: data.updated_at,
      pushed_at: data.pushed_at,
      has_issues: data.has_issues,
      has_wiki: data.has_wiki,
      has_pages: data.has_pages,
      archived: data.archived,
      disabled: data.disabled,
      license: data.license ? data.license.spdx_id : null,
      topics: data.topics || [],
      visibility: data.visibility,
    };
  } catch (err) {
    results.errors.push({ endpoint: 'repo_metadata', error: err.message });
    results.verified = false;
  }

  // Languages breakdown
  try {
    results.data.languages = fetchJSON(`${GITHUB_API}/repos/${slug}/languages`);
  } catch (err) {
    results.errors.push({ endpoint: 'languages', error: err.message });
  }

  // Recent commits (last 10)
  try {
    const commits = fetchJSON(`${GITHUB_API}/repos/${slug}/commits?per_page=10`);
    results.data.recent_commits = commits.map(c => ({
      sha: c.sha.slice(0, 7),
      message: (c.commit.message || '').split('\n')[0].slice(0, 100),
      author: c.commit.author ? c.commit.author.name : 'unknown',
      date: c.commit.author ? c.commit.author.date : null,
    }));
  } catch (err) {
    results.errors.push({ endpoint: 'commits', error: err.message });
  }

  // Open issues summary
  try {
    const issues = fetchJSON(`${GITHUB_API}/repos/${slug}/issues?state=open&per_page=5`);
    results.data.recent_issues = issues
      .filter(i => !i.pull_request)
      .map(i => ({
        number: i.number,
        title: i.title.slice(0, 100),
        labels: (i.labels || []).map(l => l.name),
        created_at: i.created_at,
      }));
  } catch (err) {
    results.errors.push({ endpoint: 'issues', error: err.message });
  }

  // Open PRs summary
  try {
    const prs = fetchJSON(`${GITHUB_API}/repos/${slug}/pulls?state=open&per_page=5`);
    results.data.open_prs = prs.map(p => ({
      number: p.number,
      title: p.title.slice(0, 100),
      author: p.user ? p.user.login : 'unknown',
      created_at: p.created_at,
    }));
  } catch (err) {
    results.errors.push({ endpoint: 'pulls', error: err.message });
  }

  // Contributors
  try {
    const contribs = fetchJSON(`${GITHUB_API}/repos/${slug}/contributors?per_page=10`);
    if (Array.isArray(contribs)) {
      results.data.contributors = contribs.map(c => ({
        login: c.login,
        contributions: c.contributions,
      }));
    }
  } catch (err) {
    results.errors.push({ endpoint: 'contributors', error: err.message });
  }

  // README existence check
  results.data.has_readme = urlExists(`${GITHUB_API}/repos/${slug}/readme`);

  return results;
}

/**
 * Scrape all configured repos and write results to disk.
 */
async function scrapeAll() {
  console.log(`[scraper] Starting scrape of ${REPOS.length} repos at ${new Date().toISOString()}`);

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const results = {
    run_id: `scrape-${Date.now()}`,
    started_at: new Date().toISOString(),
    repos: [],
    summary: {},
  };

  for (const repo of REPOS) {
    console.log(`[scraper] Scraping ${repo.owner}/${repo.name} (${repo.role})...`);
    const repoData = await scrapeRepo(repo);
    results.repos.push(repoData);

    if (repoData.errors.length > 0) {
      console.log(`[scraper]   -> ${repoData.errors.length} error(s): ${repoData.errors.map(e => e.endpoint).join(', ')}`);
    } else {
      console.log(`[scraper]   -> OK`);
    }
  }

  results.completed_at = new Date().toISOString();

  // Build summary from verified data only
  const verified = results.repos.filter(r => r.verified);
  results.summary = {
    total_repos_scraped: results.repos.length,
    verified_repos: verified.length,
    total_open_issues: verified.reduce((sum, r) => {
      return sum + (r.data.metadata ? r.data.metadata.open_issues : 0);
    }, 0),
    total_stars: verified.reduce((sum, r) => {
      return sum + (r.data.metadata ? r.data.metadata.stars : 0);
    }, 0),
    total_forks: verified.reduce((sum, r) => {
      return sum + (r.data.metadata ? r.data.metadata.forks : 0);
    }, 0),
    languages_detected: [...new Set(
      verified
        .map(r => r.data.metadata ? r.data.metadata.language : null)
        .filter(Boolean)
    )],
    all_topics: [...new Set(
      verified.flatMap(r => r.data.metadata ? r.data.metadata.topics : [])
    )],
    last_push: verified
      .map(r => r.data.metadata ? r.data.metadata.pushed_at : null)
      .filter(Boolean)
      .sort()
      .reverse()[0] || null,
  };

  fs.writeFileSync(SCRAPE_RESULTS_FILE, JSON.stringify(results, null, 2));
  console.log(`[scraper] Results written to ${SCRAPE_RESULTS_FILE}`);
  console.log(`[scraper] Summary: ${results.summary.verified_repos}/${results.summary.total_repos_scraped} verified, ${results.summary.total_open_issues} open issues across repos`);

  return results;
}

// Run if called directly
if (require.main === module) {
  scrapeAll().catch(err => {
    console.error('[scraper] Fatal error:', err.message);
    process.exit(1);
  });
}

module.exports = { scrapeRepo, scrapeAll };
