/**
 * BlackRoad OS Operator — Repo Scraper
 *
 * Fetches LIVE data from the GitHub API for each target repo.
 * Zero assumptions. Every number in the output was fetched, not guessed.
 *
 * Uses curl as the HTTP backend (proxy-aware out of the box).
 * Handles rate limiting with retry + backoff.
 *
 * Output: scraper/data/repos.json  (timestamped snapshot)
 *         scraper/data/org.json    (org-level totals)
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "data");
const REPOS_CONFIG = JSON.parse(readFileSync(join(__dirname, "repos.json"), "utf8"));
const GITHUB_API = "https://api.github.com";
const TOKEN = process.env.GITHUB_TOKEN || "";
const MAX_RETRIES = 3;

function sleep(ms) {
  execSync(`sleep ${Math.ceil(ms / 1000)}`);
}

function fetchJSON(url, retries = 0) {
  const args = [
    "curl", "-s", "--max-time", "25",
    "-H", "Accept: application/vnd.github+json",
    "-H", "User-Agent: blackroad-os-operator-scraper/0.1",
  ];
  if (TOKEN) args.push("-H", `Authorization: Bearer ${TOKEN}`);
  args.push(url);

  const cmd = args.map((a) => `'${a.replace(/'/g, "'\\''")}'`).join(" ");
  try {
    const stdout = execSync(cmd, { timeout: 30_000, encoding: "utf8" });
    if (!stdout.trim()) {
      throw new Error("Empty response");
    }
    const data = JSON.parse(stdout);

    // Rate limited — retry with backoff
    if (data.message && /rate limit/i.test(data.message)) {
      if (retries < MAX_RETRIES) {
        const wait = Math.pow(2, retries + 1) * 1000;
        console.log(` [rate-limited, retrying in ${wait / 1000}s...]`);
        sleep(wait);
        return fetchJSON(url, retries + 1);
      }
      throw new Error(`Rate limited after ${MAX_RETRIES} retries: ${data.message}`);
    }

    if (data.message && data.documentation_url) {
      throw new Error(`GitHub API error: ${data.message}`);
    }
    return data;
  } catch (err) {
    if (retries < MAX_RETRIES && !err.message.includes("Rate limited after")) {
      const wait = Math.pow(2, retries + 1) * 1000;
      console.log(` [error, retrying in ${wait / 1000}s...]`);
      sleep(wait);
      return fetchJSON(url, retries + 1);
    }
    throw new Error(`GitHub API request failed for ${url}: ${err.message}`);
  }
}

function scrapeRepo(fullName) {
  const data = fetchJSON(`${GITHUB_API}/repos/${fullName}`);

  const out = {};
  for (const field of REPOS_CONFIG.scrape_fields) {
    out[field] = data[field] ?? null;
  }

  out.license_spdx = data.license?.spdx_id ?? null;

  // Branch count (up to 100)
  try {
    const allBranches = fetchJSON(`${GITHUB_API}/repos/${fullName}/branches?per_page=100`);
    out.branch_count = Array.isArray(allBranches) ? allBranches.length : 0;
  } catch {
    out.branch_count = null;
  }

  // Recent commits (last 5)
  try {
    const commits = fetchJSON(`${GITHUB_API}/repos/${fullName}/commits?per_page=5`);
    out.recent_commits = (Array.isArray(commits) ? commits : []).map((c) => ({
      sha: c.sha?.slice(0, 7),
      message: c.commit?.message?.split("\n")[0]?.slice(0, 120),
      date: c.commit?.committer?.date,
      author: c.commit?.author?.name,
    }));
  } catch {
    out.recent_commits = [];
  }

  // Contributors count
  try {
    const contributors = fetchJSON(`${GITHUB_API}/repos/${fullName}/contributors?per_page=100`);
    out.contributor_count = Array.isArray(contributors) ? contributors.length : 0;
  } catch {
    out.contributor_count = null;
  }

  return out;
}

function scrapeOrg(orgName) {
  const data = fetchJSON(`${GITHUB_API}/orgs/${orgName}`);
  return {
    login: data.login,
    name: data.name,
    description: data.description,
    public_repos: data.public_repos,
    followers: data.followers,
    following: data.following,
    created_at: data.created_at,
    updated_at: data.updated_at,
    blog: data.blog,
    location: data.location,
    email: data.email,
  };
}

function main() {
  mkdirSync(DATA_DIR, { recursive: true });

  console.log(`[scraper] Fetching org data for ${REPOS_CONFIG.org}...`);
  const orgData = scrapeOrg(REPOS_CONFIG.org);

  console.log(`[scraper] Scraping ${REPOS_CONFIG.targets.length} repos...`);
  const results = [];
  for (const target of REPOS_CONFIG.targets) {
    process.stdout.write(`  -> ${target}...`);
    try {
      const data = scrapeRepo(target);
      data._scraped_at = new Date().toISOString();
      data._status = "ok";
      results.push(data);
      console.log(` OK (${data.open_issues_count} issues, ${data.branch_count ?? "?"} branches)`);
    } catch (err) {
      console.log(` FAIL: ${err.message}`);
      results.push({
        full_name: target,
        _scraped_at: new Date().toISOString(),
        _status: "error",
        _error: err.message,
      });
    }
  }

  const snapshot = {
    scraped_at: new Date().toISOString(),
    org: orgData,
    repo_count: results.length,
    repos_ok: results.filter((r) => r._status === "ok").length,
    repos_error: results.filter((r) => r._status === "error").length,
    repos: results,
  };

  const reposPath = join(DATA_DIR, "repos.json");
  const orgPath = join(DATA_DIR, "org.json");

  writeFileSync(reposPath, JSON.stringify(snapshot, null, 2));
  writeFileSync(orgPath, JSON.stringify(orgData, null, 2));

  console.log(`\n[scraper] Done. ${snapshot.repos_ok}/${snapshot.repo_count} repos scraped successfully.`);
  console.log(`[scraper] Data written to ${reposPath}`);

  if (snapshot.repos_error > 0) {
    console.error(`[scraper] WARNING: ${snapshot.repos_error} repo(s) failed to scrape.`);
    process.exitCode = 1;
  }
}

main();
