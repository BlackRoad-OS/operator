import { GitHubScraper } from '../scraper/github-scraper.js';
import { SEOAnalyzer } from '../seo/seo-analyzer.js';
import fs from 'node:fs';
import path from 'node:path';

/**
 * E2E Runner - Orchestrates full end-to-end validation across target repos.
 * Runs scraper + SEO analysis + health checks. Reports only verified data.
 */
class E2ERunner {
  constructor(options = {}) {
    this.scraper = new GitHubScraper(options.scraper || {});
    this.seo = new SEOAnalyzer(options.seo || {});
    this.outputDir = options.outputDir || path.join(process.cwd(), 'reports');
    this.targets = options.targets || [];
  }

  async runAll() {
    const ts = new Date().toISOString();
    const results = {
      run_id: `e2e-${Date.now()}`,
      started_at: ts,
      completed_at: null,
      targets: [],
      summary: null,
    };

    for (const target of this.targets) {
      const targetResult = await this.runTarget(target);
      results.targets.push(targetResult);
    }

    results.completed_at = new Date().toISOString();
    results.summary = this._buildSummary(results.targets);

    await this._saveReport(results);
    return results;
  }

  async runTarget(target) {
    const { owner, repo } = target;
    const ts = new Date().toISOString();

    const [repoData, seoData] = await Promise.allSettled([
      this.scraper.fullScrape(owner, repo),
      this.seo.analyzeGitHubRepo(owner, repo),
    ]);

    const scraperResult = repoData.status === 'fulfilled' ? repoData.value : { status: 'error', error: repoData.reason?.message, verified: false };
    const seoResult = seoData.status === 'fulfilled' ? seoData.value : { status: 'error', error: seoData.reason?.message, verified: false };

    const healthChecks = this._runHealthChecks(scraperResult, seoResult);

    return {
      owner, repo,
      tested_at: ts,
      scraper: scraperResult,
      seo: seoResult,
      health: healthChecks,
      verified: scraperResult.verified && (seoResult.verified || seoResult.status === 'error'),
    };
  }

  _runHealthChecks(scraperResult, seoResult) {
    const checks = [];

    const check = (name, fn) => {
      try {
        const result = fn();
        checks.push({ name, ...result });
      } catch (err) {
        checks.push({ name, passed: false, message: `Check error: ${err.message}` });
      }
    };

    check('repo_accessible', () => ({
      passed: scraperResult.verified === true,
      message: scraperResult.verified ? 'Repo API accessible' : `API error: ${scraperResult.error || 'unknown'}`,
    }));

    check('repo_not_archived', () => {
      if (!scraperResult.repo?.metrics) return { passed: false, message: 'No repo data' };
      return {
        passed: !scraperResult.repo.metrics.archived,
        message: scraperResult.repo.metrics.archived ? 'Repo is archived' : 'Repo is active',
      };
    });

    check('has_recent_activity', () => {
      if (!scraperResult.commits?.latest_commit) return { passed: false, message: 'No commit data' };
      const lastCommit = new Date(scraperResult.commits.latest_commit.date);
      const daysSince = (Date.now() - lastCommit.getTime()) / (1000 * 60 * 60 * 24);
      return {
        passed: daysSince < 90,
        message: `Last commit ${Math.round(daysSince)} days ago`,
        value: Math.round(daysSince),
      };
    });

    check('ci_passing', () => {
      if (!scraperResult.runs?.runs?.length) return { passed: null, message: 'No CI runs found' };
      const latest = scraperResult.runs.runs[0];
      return {
        passed: latest.conclusion === 'success',
        message: `Latest run: ${latest.conclusion || latest.status}`,
        value: latest.conclusion || latest.status,
      };
    });

    check('seo_score', () => {
      if (!seoResult.score) return { passed: null, message: 'No SEO data' };
      return {
        passed: seoResult.score.percentage >= 50,
        message: `SEO score: ${seoResult.score.percentage}%`,
        value: seoResult.score.percentage,
      };
    });

    const passed = checks.filter(c => c.passed === true).length;
    const failed = checks.filter(c => c.passed === false).length;
    const skipped = checks.filter(c => c.passed === null).length;

    return { checks, passed, failed, skipped, total: checks.length };
  }

  _buildSummary(targets) {
    const total = targets.length;
    const verified = targets.filter(t => t.verified).length;
    const healthy = targets.filter(t => t.health.failed === 0).length;
    const totalChecks = targets.reduce((s, t) => s + t.health.total, 0);
    const passedChecks = targets.reduce((s, t) => s + t.health.passed, 0);
    const failedChecks = targets.reduce((s, t) => s + t.health.failed, 0);

    return {
      total_targets: total,
      verified_targets: verified,
      healthy_targets: healthy,
      total_checks: totalChecks,
      passed_checks: passedChecks,
      failed_checks: failedChecks,
      health_percentage: totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0,
    };
  }

  async _saveReport(results) {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    const filename = `e2e-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(this.outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(results, null, 2));

    const latestPath = path.join(this.outputDir, 'latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(results, null, 2));

    return filepath;
  }
}

export { E2ERunner };
