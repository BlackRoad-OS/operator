import { E2ERunner } from '../src/e2e/runner.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Mock the dependencies
jest.mock('../src/scraper/github-scraper.js');
jest.mock('../src/seo/seo-analyzer.js');

import { GitHubScraper } from '../src/scraper/github-scraper.js';
import { SEOAnalyzer } from '../src/seo/seo-analyzer.js';

describe('E2ERunner', () => {
  let runner;
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-test-'));
    jest.clearAllMocks();

    // Set up mock implementations
    GitHubScraper.mockImplementation(() => ({
      fullScrape: jest.fn().mockResolvedValue({
        verified: true,
        repo: {
          verified: true,
          metrics: { stars: 10, forks: 2, archived: false, pushed_at: new Date().toISOString() },
        },
        commits: {
          verified: true,
          latest_commit: { sha: 'abc', date: new Date().toISOString(), message: 'test' },
        },
        workflows: { verified: true, total_workflows: 1, workflows: [] },
        runs: {
          verified: true,
          runs: [{ conclusion: 'success', status: 'completed' }],
        },
        pulls: { verified: true, count: 0, pulls: [] },
      }),
    }));

    SEOAnalyzer.mockImplementation(() => ({
      analyzeGitHubRepo: jest.fn().mockResolvedValue({
        verified: true,
        score: { percentage: 75, score: 9, max_score: 12 },
      }),
    }));

    runner = new E2ERunner({
      targets: [
        { owner: 'TestOrg', repo: 'test-repo' },
        { owner: 'TestOrg', repo: 'test-repo-2' },
      ],
      outputDir: tmpDir,
    });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('runAll', () => {
    it('runs E2E against all targets', async () => {
      const results = await runner.runAll();
      expect(results.run_id).toMatch(/^e2e-\d+$/);
      expect(results.started_at).toBeTruthy();
      expect(results.completed_at).toBeTruthy();
      expect(results.targets).toHaveLength(2);
    });

    it('generates summary with verified counts', async () => {
      const results = await runner.runAll();
      expect(results.summary).toBeTruthy();
      expect(results.summary.total_targets).toBe(2);
      expect(results.summary.verified_targets).toBe(2);
      expect(results.summary.health_percentage).toBeGreaterThan(0);
    });

    it('saves report to output dir', async () => {
      await runner.runAll();
      const latestPath = path.join(tmpDir, 'latest.json');
      expect(fs.existsSync(latestPath)).toBe(true);
      const saved = JSON.parse(fs.readFileSync(latestPath, 'utf8'));
      expect(saved.run_id).toBeTruthy();
    });
  });

  describe('runTarget', () => {
    it('returns verified target result', async () => {
      const result = await runner.runTarget({ owner: 'TestOrg', repo: 'test-repo' });
      expect(result.owner).toBe('TestOrg');
      expect(result.repo).toBe('test-repo');
      expect(result.verified).toBe(true);
      expect(result.health.checks.length).toBeGreaterThan(0);
    });

    it('runs health checks', async () => {
      const result = await runner.runTarget({ owner: 'TestOrg', repo: 'test-repo' });
      const checkNames = result.health.checks.map(c => c.name);
      expect(checkNames).toContain('repo_accessible');
      expect(checkNames).toContain('repo_not_archived');
      expect(checkNames).toContain('has_recent_activity');
      expect(checkNames).toContain('ci_passing');
      expect(checkNames).toContain('seo_score');
    });
  });

  describe('health checks', () => {
    it('detects archived repos', async () => {
      GitHubScraper.mockImplementation(() => ({
        fullScrape: jest.fn().mockResolvedValue({
          verified: true,
          repo: { verified: true, metrics: { archived: true } },
          commits: { verified: true, latest_commit: null },
          workflows: { verified: true },
          runs: { verified: true, runs: [] },
          pulls: { verified: true },
        }),
      }));

      const freshRunner = new E2ERunner({
        targets: [{ owner: 'Test', repo: 'archived' }],
        outputDir: tmpDir,
      });
      const results = await freshRunner.runAll();
      const archivedCheck = results.targets[0].health.checks.find(c => c.name === 'repo_not_archived');
      expect(archivedCheck.passed).toBe(false);
    });

    it('detects stale repos', async () => {
      const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(); // 100 days ago
      GitHubScraper.mockImplementation(() => ({
        fullScrape: jest.fn().mockResolvedValue({
          verified: true,
          repo: { verified: true, metrics: { archived: false } },
          commits: { verified: true, latest_commit: { sha: 'abc', date: oldDate, message: 'old' } },
          workflows: { verified: true },
          runs: { verified: true, runs: [] },
          pulls: { verified: true },
        }),
      }));

      const freshRunner = new E2ERunner({
        targets: [{ owner: 'Test', repo: 'stale' }],
        outputDir: tmpDir,
      });
      const results = await freshRunner.runAll();
      const activityCheck = results.targets[0].health.checks.find(c => c.name === 'has_recent_activity');
      expect(activityCheck.passed).toBe(false);
    });

    it('handles scraper failure gracefully', async () => {
      GitHubScraper.mockImplementation(() => ({
        fullScrape: jest.fn().mockRejectedValue(new Error('API down')),
      }));

      const freshRunner = new E2ERunner({
        targets: [{ owner: 'Test', repo: 'fail' }],
        outputDir: tmpDir,
      });
      const results = await freshRunner.runAll();
      expect(results.targets[0].verified).toBe(false);
    });
  });
});
