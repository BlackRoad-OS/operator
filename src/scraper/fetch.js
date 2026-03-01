import { GITHUB_API, RETRY, SCRAPE_TIMEOUT_MS } from "./config.js";

/**
 * Fetch with exponential backoff retry and timeout.
 * Returns { ok, status, data } or { ok: false, error }.
 */
export async function fetchWithRetry(url, attempt = 0) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);

    const headers = { "User-Agent": "BlackRoad-OS-Operator/1.0" };
    const token = process.env.GITHUB_TOKEN;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timer);

    if (res.status === 403 && attempt < RETRY.maxAttempts - 1) {
      // Rate limited — back off
      await sleep(RETRY.backoffMs[attempt]);
      return fetchWithRetry(url, attempt + 1);
    }

    if (!res.ok) {
      return { ok: false, status: res.status, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    return { ok: true, status: res.status, data };
  } catch (err) {
    if (attempt < RETRY.maxAttempts - 1) {
      await sleep(RETRY.backoffMs[attempt]);
      return fetchWithRetry(url, attempt + 1);
    }
    return { ok: false, status: 0, error: err.message };
  }
}

/**
 * Scrape a single repo from the GitHub API.
 * Returns raw repo metadata or null.
 */
export async function scrapeRepo(org, name) {
  const url = `${GITHUB_API}/repos/${org}/${name}`;
  const result = await fetchWithRetry(url);

  if (!result.ok) {
    return {
      name,
      scraped_at: new Date().toISOString(),
      reachable: false,
      error: result.error,
      status: result.status,
    };
  }

  const d = result.data;
  return {
    name: d.name,
    full_name: d.full_name,
    scraped_at: new Date().toISOString(),
    reachable: true,
    exists: true,
    private: d.private,
    description: d.description,
    language: d.language,
    default_branch: d.default_branch,
    stars: d.stargazers_count,
    forks: d.forks_count,
    open_issues: d.open_issues_count,
    watchers: d.watchers_count,
    size_kb: d.size,
    has_license: d.license !== null,
    license_spdx: d.license?.spdx_id ?? null,
    created_at: d.created_at,
    updated_at: d.updated_at,
    pushed_at: d.pushed_at,
    has_commits: d.size > 0,
    topics: d.topics ?? [],
    archived: d.archived,
    disabled: d.disabled,
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
