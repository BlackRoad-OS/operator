import { GitHubScraper } from '../src/scraper/github-scraper.js';

// Mock axios to test without network
jest.mock('axios');
import axios from 'axios';

describe('GitHubScraper', () => {
  let scraper;

  beforeEach(() => {
    scraper = new GitHubScraper({ token: 'test-token' });
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('uses defaults when no options provided', () => {
      const s = new GitHubScraper();
      expect(s.baseUrl).toBe('https://api.github.com');
      expect(s.timeout).toBe(15000);
      expect(s.retries).toBe(3);
    });

    it('accepts custom options', () => {
      const s = new GitHubScraper({ baseUrl: 'http://test', timeout: 5000, retries: 1 });
      expect(s.baseUrl).toBe('http://test');
      expect(s.timeout).toBe(5000);
      expect(s.retries).toBe(1);
    });
  });

  describe('_headers', () => {
    it('includes auth token when provided', () => {
      const h = scraper._headers();
      expect(h['Authorization']).toBe('Bearer test-token');
      expect(h['User-Agent']).toBe('BlackRoad-Operator/1.0');
    });

    it('omits auth when no token', () => {
      const s = new GitHubScraper();
      const h = s._headers();
      expect(h['Authorization']).toBeUndefined();
    });
  });

  describe('scrapeRepo', () => {
    it('returns verified repo data on success', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          stargazers_count: 42,
          forks_count: 7,
          subscribers_count: 3,
          open_issues_count: 5,
          size: 1024,
          default_branch: 'main',
          language: 'JavaScript',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-06-01T00:00:00Z',
          pushed_at: '2024-06-01T00:00:00Z',
          archived: false,
          disabled: false,
          visibility: 'public',
          has_issues: true,
          has_wiki: true,
          has_pages: false,
          license: { spdx_id: 'MIT' },
          description: 'Test repo',
          topics: ['test'],
        },
        status: 200,
        headers: {},
      });

      const result = await scraper.scrapeRepo('owner', 'repo');
      expect(result.verified).toBe(true);
      expect(result.status).toBe('ok');
      expect(result.metrics.stars).toBe(42);
      expect(result.metrics.forks).toBe(7);
      expect(result.metrics.language).toBe('JavaScript');
      expect(result.scraped_at).toBeTruthy();
    });

    it('returns error on network failure', async () => {
      scraper = new GitHubScraper({ token: 'test', retries: 1, retryDelay: 10 });
      axios.get.mockRejectedValue(new Error('Network error'));

      const result = await scraper.scrapeRepo('owner', 'repo');
      expect(result.verified).toBe(false);
      expect(result.status).toBe('error');
      expect(result.error).toBe('Network error');
    });

    it('retries on failure before giving up', async () => {
      scraper = new GitHubScraper({ token: 'test', retries: 2, retryDelay: 10 });
      axios.get
        .mockRejectedValueOnce(new Error('fail1'))
        .mockResolvedValueOnce({
          data: { stargazers_count: 1, forks_count: 0, subscribers_count: 0, open_issues_count: 0, size: 0, default_branch: 'main', language: null, created_at: '', updated_at: '', pushed_at: '', archived: false, disabled: false, visibility: 'public', has_issues: true, has_wiki: true, has_pages: false, license: null, description: '', topics: [] },
          status: 200, headers: {},
        });

      const result = await scraper.scrapeRepo('owner', 'repo');
      expect(result.verified).toBe(true);
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('scrapeRepoCommits', () => {
    it('returns verified commit data', async () => {
      axios.get.mockResolvedValueOnce({
        data: [
          { sha: 'abc123', commit: { message: 'fix: something\n\ndetails', author: { name: 'Dev', date: '2024-06-01T00:00:00Z' } } },
          { sha: 'def456', commit: { message: 'feat: new thing', author: { name: 'Dev', date: '2024-05-31T00:00:00Z' } } },
        ],
        status: 200, headers: {},
      });

      const result = await scraper.scrapeRepoCommits('owner', 'repo');
      expect(result.verified).toBe(true);
      expect(result.commit_count).toBe(2);
      expect(result.latest_commit.sha).toBe('abc123');
      expect(result.latest_commit.message).toBe('fix: something');
    });
  });

  describe('scrapeRepoWorkflows', () => {
    it('returns workflow data', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          total_count: 2,
          workflows: [
            { id: 1, name: 'CI', state: 'active', path: '.github/workflows/ci.yml', created_at: '2024-01-01', updated_at: '2024-06-01' },
            { id: 2, name: 'Deploy', state: 'active', path: '.github/workflows/deploy.yml', created_at: '2024-01-01', updated_at: '2024-06-01' },
          ],
        },
        status: 200, headers: {},
      });

      const result = await scraper.scrapeRepoWorkflows('owner', 'repo');
      expect(result.verified).toBe(true);
      expect(result.total_workflows).toBe(2);
      expect(result.workflows[0].name).toBe('CI');
    });
  });

  describe('scrapeRepoLatestRuns', () => {
    it('returns run data', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          total_count: 50,
          workflow_runs: [
            { id: 100, name: 'CI', status: 'completed', conclusion: 'success', head_branch: 'main', event: 'push', created_at: '2024-06-01', updated_at: '2024-06-01', run_started_at: '2024-06-01', html_url: 'https://github.com/owner/repo/actions/runs/100' },
          ],
        },
        status: 200, headers: {},
      });

      const result = await scraper.scrapeRepoLatestRuns('owner', 'repo');
      expect(result.verified).toBe(true);
      expect(result.total_runs).toBe(50);
      expect(result.runs[0].conclusion).toBe('success');
    });
  });

  describe('scrapeRepoPulls', () => {
    it('returns pull request data', async () => {
      axios.get.mockResolvedValueOnce({
        data: [
          { number: 1, title: 'Fix bug', state: 'open', user: { login: 'dev' }, created_at: '2024-06-01', updated_at: '2024-06-01', merged_at: null, draft: false },
        ],
        status: 200, headers: {},
      });

      const result = await scraper.scrapeRepoPulls('owner', 'repo');
      expect(result.verified).toBe(true);
      expect(result.count).toBe(1);
      expect(result.pulls[0].title).toBe('Fix bug');
    });
  });

  describe('fullScrape', () => {
    it('runs all scrapers in parallel', async () => {
      // Mock 5 sequential calls (repo, commits, workflows, runs, pulls)
      const mockRepoData = {
        data: { stargazers_count: 10, forks_count: 2, subscribers_count: 1, open_issues_count: 0, size: 500, default_branch: 'main', language: 'JS', created_at: '', updated_at: '', pushed_at: '', archived: false, disabled: false, visibility: 'public', has_issues: true, has_wiki: true, has_pages: false, license: null, description: '', topics: [] },
        status: 200, headers: {},
      };
      const mockCommits = { data: [], status: 200, headers: {} };
      const mockWorkflows = { data: { total_count: 0, workflows: [] }, status: 200, headers: {} };
      const mockRuns = { data: { total_count: 0, workflow_runs: [] }, status: 200, headers: {} };
      const mockPulls = { data: [], status: 200, headers: {} };

      axios.get
        .mockResolvedValueOnce(mockRepoData)
        .mockResolvedValueOnce(mockCommits)
        .mockResolvedValueOnce(mockWorkflows)
        .mockResolvedValueOnce(mockRuns)
        .mockResolvedValueOnce(mockPulls);

      const result = await scraper.fullScrape('owner', 'repo');
      expect(result.verified).toBe(true);
      expect(result.repo).toBeTruthy();
      expect(result.commits).toBeTruthy();
      expect(result.workflows).toBeTruthy();
      expect(result.runs).toBeTruthy();
      expect(result.pulls).toBeTruthy();
    });
  });
});
