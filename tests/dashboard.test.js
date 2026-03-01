'use strict';

const { StatusDashboard } = require('../src/dashboard/status');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('StatusDashboard', () => {
  let dashboard;
  let tmpDir;

  const mockReport = {
    run_id: 'e2e-12345',
    started_at: '2026-03-01T00:00:00.000Z',
    completed_at: '2026-03-01T00:00:05.000Z',
    summary: {
      total_targets: 2,
      verified_targets: 2,
      healthy_targets: 1,
      total_checks: 10,
      passed_checks: 8,
      failed_checks: 2,
      health_percentage: 80,
    },
    targets: [
      {
        owner: 'BlackRoad-OS',
        repo: 'operator',
        verified: true,
        scraper: {
          repo: {
            metrics: { stars: 10, forks: 2, open_issues: 1, language: 'JavaScript', pushed_at: '2026-03-01T00:00:00Z' },
          },
        },
        seo: { score: { percentage: 75, score: 9, max_score: 12 } },
        health: {
          checks: [
            { name: 'repo_accessible', passed: true, message: 'Repo API accessible' },
            { name: 'ci_passing', passed: true, message: 'Latest run: success' },
            { name: 'seo_score', passed: true, message: 'SEO score: 75%' },
          ],
          passed: 3,
          failed: 0,
          skipped: 0,
          total: 3,
        },
      },
      {
        owner: 'BlackRoad-OS',
        repo: 'failing-repo',
        verified: true,
        scraper: { repo: { metrics: { stars: 0, forks: 0, open_issues: 5, language: 'Python', pushed_at: '2025-01-01T00:00:00Z' } } },
        seo: { score: { percentage: 30, score: 3, max_score: 12 } },
        health: {
          checks: [
            { name: 'repo_accessible', passed: true, message: 'Repo API accessible' },
            { name: 'ci_passing', passed: false, message: 'Latest run: failure' },
            { name: 'seo_score', passed: false, message: 'SEO score: 30%' },
          ],
          passed: 1,
          failed: 2,
          skipped: 0,
          total: 3,
        },
      },
    ],
  };

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dashboard-test-'));
    dashboard = new StatusDashboard({ reportsDir: tmpDir });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('loadLatest', () => {
    it('returns null when no report exists', () => {
      expect(dashboard.loadLatest()).toBeNull();
    });

    it('loads latest report', () => {
      fs.writeFileSync(path.join(tmpDir, 'latest.json'), JSON.stringify(mockReport));
      const loaded = dashboard.loadLatest();
      expect(loaded.run_id).toBe('e2e-12345');
    });
  });

  describe('generateMarkdown', () => {
    it('shows no-data message when no report', () => {
      const md = dashboard.generateMarkdown(null);
      expect(md).toContain('No verified data');
      expect(md).toContain('npm run e2e');
    });

    it('generates markdown with verified data', () => {
      const md = dashboard.generateMarkdown(mockReport);
      expect(md).toContain('# Operator Status');
      expect(md).toContain('Last verified:');
      expect(md).toContain('e2e-12345');
      expect(md).toContain('| YES |');
      expect(md).toContain('BlackRoad-OS/operator');
      expect(md).toContain('verified at scrape time');
    });

    it('marks PASS/FAIL correctly', () => {
      const md = dashboard.generateMarkdown(mockReport);
      expect(md).toContain('[PASS] BlackRoad-OS/operator');
      expect(md).toContain('[FAIL] BlackRoad-OS/failing-repo');
    });

    it('includes real metrics only', () => {
      const md = dashboard.generateMarkdown(mockReport);
      expect(md).toContain('| Stars | 10 |');
      expect(md).toContain('| Language | JavaScript |');
      // Should NOT contain any unverified claims
      expect(md).not.toContain('approximately');
      expect(md).not.toContain('estimated');
    });

    it('includes health checks', () => {
      const md = dashboard.generateMarkdown(mockReport);
      expect(md).toContain('[PASS] repo_accessible');
      expect(md).toContain('[FAIL] ci_passing: Latest run: failure');
    });

    it('includes SEO score', () => {
      const md = dashboard.generateMarkdown(mockReport);
      expect(md).toContain('**SEO Score:** 75%');
      expect(md).toContain('**SEO Score:** 30%');
    });
  });

  describe('generateJSON', () => {
    it('returns no_data when no report', () => {
      const json = dashboard.generateJSON(null);
      expect(json.status).toBe('no_data');
    });

    it('returns structured JSON', () => {
      const json = dashboard.generateJSON(mockReport);
      expect(json.status).toBe('ok');
      expect(json.targets).toHaveLength(2);
      expect(json.targets[0].repo).toBe('BlackRoad-OS/operator');
      expect(json.targets[0].healthy).toBe(true);
      expect(json.targets[1].healthy).toBe(false);
      expect(json.summary.health_percentage).toBe(80);
    });
  });
});
