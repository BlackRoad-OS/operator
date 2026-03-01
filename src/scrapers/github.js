import https from "node:https";
import { REPO_TARGETS } from "../types/repo.js";

const UA = "BlackRoad-Operator/0.1";

/**
 * Make an HTTPS GET request to the GitHub API.
 * @param {string} path
 * @returns {Promise<{status: number, data: any, headers: Object}>}
 */
function githubGet(path) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: "api.github.com",
      path,
      method: "GET",
      headers: {
        "User-Agent": UA,
        Accept: "application/vnd.github+json",
      },
    };
    if (process.env.GITHUB_TOKEN) {
      opts.headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    const req = https.request(opts, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body),
            headers: res.headers,
          });
        } catch {
          reject(new Error(`JSON parse failed for ${path}: ${body.slice(0, 200)}`));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error(`Timeout: ${path}`));
    });
    req.end();
  });
}

/**
 * Scrape a single GitHub repository for all metrics.
 * @param {string} fullName - e.g. "BlackRoad-OS/blackroad"
 * @returns {Promise<import('../types/repo.js').ScrapeResult>}
 */
export async function scrapeRepo(fullName) {
  const start = Date.now();
  try {
    // Fetch repo metadata
    const { status, data } = await githubGet(`/repos/${fullName}`);
    if (status !== 200) {
      return {
        success: false,
        data: null,
        error: `HTTP ${status}: ${data.message || "unknown"}`,
        duration_ms: Date.now() - start,
      };
    }

    // Fetch languages (separate endpoint)
    let languages = {};
    try {
      const langResp = await githubGet(`/repos/${fullName}/languages`);
      if (langResp.status === 200) languages = langResp.data;
    } catch {
      // Non-critical, continue
    }

    // Fetch latest commit
    let last_commit_message = "";
    let last_commit_date = "";
    try {
      const commitResp = await githubGet(`/repos/${fullName}/commits?per_page=1`);
      if (commitResp.status === 200 && Array.isArray(commitResp.data) && commitResp.data.length > 0) {
        last_commit_message = commitResp.data[0].commit.message.split("\n")[0].slice(0, 120);
        last_commit_date = commitResp.data[0].commit.committer.date;
      }
    } catch {
      // Non-critical
    }

    // Fetch contributors
    let contributors = [];
    try {
      const contribResp = await githubGet(`/repos/${fullName}/contributors?per_page=10`);
      if (contribResp.status === 200 && Array.isArray(contribResp.data)) {
        contributors = contribResp.data.map((c) => ({
          login: c.login,
          contributions: c.contributions,
        }));
      }
    } catch {
      // Non-critical
    }

    /** @type {import('../types/repo.js').RepoMetrics} */
    const metrics = {
      name: data.name,
      full_name: data.full_name,
      description: data.description,
      language: data.language,
      stars: data.stargazers_count,
      forks: data.forks_count,
      open_issues: data.open_issues_count,
      watchers: data.watchers_count,
      size_kb: data.size,
      default_branch: data.default_branch,
      created_at: data.created_at,
      updated_at: data.updated_at,
      pushed_at: data.pushed_at,
      topics: data.topics || [],
      license: data.license?.spdx_id || null,
      html_url: data.html_url,
      languages,
      last_commit_message,
      last_commit_date,
      contributors,
      scraped_at: Date.now(),
    };

    return {
      success: true,
      data: metrics,
      error: null,
      duration_ms: Date.now() - start,
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err.message,
      duration_ms: Date.now() - start,
    };
  }
}

/**
 * Scrape all target repos. Runs sequentially to respect rate limits.
 * @param {string[]} [repos] - Override default target list
 * @returns {Promise<Map<string, import('../types/repo.js').ScrapeResult>>}
 */
export async function scrapeAll(repos = REPO_TARGETS) {
  const results = new Map();
  for (const repo of repos) {
    const result = await scrapeRepo(repo);
    results.set(repo, result);
    // Small delay between requests to be polite
    if (repos.indexOf(repo) < repos.length - 1) {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  return results;
}
