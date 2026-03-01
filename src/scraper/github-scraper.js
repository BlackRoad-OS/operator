'use strict';

const axios = require('axios');

/**
 * GitHubScraper - Scrapes and validates real metrics from GitHub repos.
 * Every number returned is verified at scrape time. Nothing cached, nothing assumed.
 */
class GitHubScraper {
  constructor(options = {}) {
    this.token = options.token || process.env.GITHUB_TOKEN || null;
    this.baseUrl = options.baseUrl || 'https://api.github.com';
    this.timeout = options.timeout || 15000;
    this.retries = options.retries || 3;
    this.retryDelay = options.retryDelay || 2000;
  }

  _headers() {
    const h = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'BlackRoad-Operator/1.0',
    };
    if (this.token) h['Authorization'] = `Bearer ${this.token}`;
    return h;
  }

  async _request(url) {
    let lastError;
    for (let attempt = 0; attempt < this.retries; attempt++) {
      try {
        const resp = await axios.get(url, {
          headers: this._headers(),
          timeout: this.timeout,
        });
        return { data: resp.data, status: resp.status, headers: resp.headers };
      } catch (err) {
        lastError = err;
        if (attempt < this.retries - 1) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }
    return { error: lastError.message, status: lastError.response?.status || 0 };
  }

  async scrapeRepo(owner, repo) {
    const ts = new Date().toISOString();
    const url = `${this.baseUrl}/repos/${owner}/${repo}`;
    const result = await this._request(url);

    if (result.error) {
      return {
        owner, repo, scraped_at: ts, status: 'error',
        error: result.error, http_status: result.status,
        verified: false,
      };
    }

    const d = result.data;
    return {
      owner, repo, scraped_at: ts, status: 'ok',
      verified: true,
      metrics: {
        stars: d.stargazers_count,
        forks: d.forks_count,
        watchers: d.subscribers_count,
        open_issues: d.open_issues_count,
        size_kb: d.size,
        default_branch: d.default_branch,
        language: d.language,
        created_at: d.created_at,
        updated_at: d.updated_at,
        pushed_at: d.pushed_at,
        archived: d.archived,
        disabled: d.disabled,
        visibility: d.visibility,
        has_issues: d.has_issues,
        has_wiki: d.has_wiki,
        has_pages: d.has_pages,
        license: d.license?.spdx_id || null,
        description: d.description,
        topics: d.topics || [],
      },
    };
  }

  async scrapeRepoCommits(owner, repo, opts = {}) {
    const ts = new Date().toISOString();
    const perPage = opts.perPage || 30;
    const sha = opts.branch || '';
    let url = `${this.baseUrl}/repos/${owner}/${repo}/commits?per_page=${perPage}`;
    if (sha) url += `&sha=${sha}`;

    const result = await this._request(url);
    if (result.error) {
      return { owner, repo, scraped_at: ts, status: 'error', error: result.error, verified: false };
    }

    const commits = result.data.map(c => ({
      sha: c.sha,
      message: c.commit.message.split('\n')[0],
      author: c.commit.author.name,
      date: c.commit.author.date,
    }));

    return {
      owner, repo, scraped_at: ts, status: 'ok', verified: true,
      commit_count: commits.length,
      latest_commit: commits[0] || null,
      commits,
    };
  }

  async scrapeRepoWorkflows(owner, repo) {
    const ts = new Date().toISOString();
    const url = `${this.baseUrl}/repos/${owner}/${repo}/actions/workflows`;
    const result = await this._request(url);

    if (result.error) {
      return { owner, repo, scraped_at: ts, status: 'error', error: result.error, verified: false };
    }

    const workflows = (result.data.workflows || []).map(w => ({
      id: w.id,
      name: w.name,
      state: w.state,
      path: w.path,
      created_at: w.created_at,
      updated_at: w.updated_at,
    }));

    return {
      owner, repo, scraped_at: ts, status: 'ok', verified: true,
      total_workflows: result.data.total_count,
      workflows,
    };
  }

  async scrapeRepoLatestRuns(owner, repo, opts = {}) {
    const ts = new Date().toISOString();
    const perPage = opts.perPage || 10;
    const url = `${this.baseUrl}/repos/${owner}/${repo}/actions/runs?per_page=${perPage}`;
    const result = await this._request(url);

    if (result.error) {
      return { owner, repo, scraped_at: ts, status: 'error', error: result.error, verified: false };
    }

    const runs = (result.data.workflow_runs || []).map(r => ({
      id: r.id,
      name: r.name,
      status: r.status,
      conclusion: r.conclusion,
      branch: r.head_branch,
      event: r.event,
      created_at: r.created_at,
      updated_at: r.updated_at,
      run_started_at: r.run_started_at,
      html_url: r.html_url,
    }));

    return {
      owner, repo, scraped_at: ts, status: 'ok', verified: true,
      total_runs: result.data.total_count,
      runs,
    };
  }

  async scrapeRepoPulls(owner, repo, opts = {}) {
    const ts = new Date().toISOString();
    const state = opts.state || 'open';
    const perPage = opts.perPage || 30;
    const url = `${this.baseUrl}/repos/${owner}/${repo}/pulls?state=${state}&per_page=${perPage}`;
    const result = await this._request(url);

    if (result.error) {
      return { owner, repo, scraped_at: ts, status: 'error', error: result.error, verified: false };
    }

    const pulls = result.data.map(p => ({
      number: p.number,
      title: p.title,
      state: p.state,
      user: p.user.login,
      created_at: p.created_at,
      updated_at: p.updated_at,
      merged_at: p.merged_at,
      draft: p.draft,
    }));

    return {
      owner, repo, scraped_at: ts, status: 'ok', verified: true,
      count: pulls.length,
      pulls,
    };
  }

  async fullScrape(owner, repo) {
    const [repoData, commits, workflows, runs, pulls] = await Promise.all([
      this.scrapeRepo(owner, repo),
      this.scrapeRepoCommits(owner, repo),
      this.scrapeRepoWorkflows(owner, repo),
      this.scrapeRepoLatestRuns(owner, repo),
      this.scrapeRepoPulls(owner, repo),
    ]);

    return {
      owner, repo,
      scraped_at: new Date().toISOString(),
      verified: repoData.verified,
      repo: repoData,
      commits,
      workflows,
      runs,
      pulls,
    };
  }
}

module.exports = { GitHubScraper };
