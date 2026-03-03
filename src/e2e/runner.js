import { GitHubScraper } from '../scraper/github-scraper.js';
import { SEOAnalyzer } from '../seo/seo-analyzer.js';
import fs from 'node:fs';
import path from 'node:path';

export class E2ERunner {
  constructor(options = {}) {
    this.scraper = new GitHubScraper(options.scraper || {});
    this.seo = new SEOAnalyzer(options.seo || {});
    this.outputDir = options.outputDir || path.join(process.cwd(), 'reports');
    this.targets = options.targets || [];
  }

  async runAll() {
    const results = { run_id: `e2e-${Date.now()}`, started_at: new Date().toISOString(), completed_at: null, targets: [], summary: null };

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

    return { owner, repo, tested_at: ts, scraper: scraperResult, seo: seoResult, health: healthChecks, verified: scraperResult.verified && (seoResult.verified || seoResult.status === 'error') };
  }

  _runHealthChecks(scraperResult, seoResult) {
    const checks = [];
    const check = (name, fn) => { try { checks.push({ name, ...fn() }); } catch (err) { checks.push({ name, passed: false, message: `Check error: ${err.message}` }); } };

    check('repo_accessible', () => ({ passed: scraperResult.verified === true, message: scraperResult.verified ? 'Repo API accessible' : `API error: ${scraperResult.error || 'unknown'}` }));
    check('repo_not_archived', () => { if (!scraperResult.repo?.metrics) return { passed: false, message: 'No repo data' }; return { passed: !scraperResult.repo.metrics.archived, message: scraperResult.repo.metrics.archived ? 'Repo is archived' : 'Repo is active' }; });

    const passed = checks.filter(c => c.passed === true).length;
    const failed = checks.filter(c => c.passed === false).length;
    const skipped = checks.filter(c => c.passed === null).length;
    return { checks, passed, failed, skipped, total: checks.length };
  }

  _buildSummary(targets) {
    const total = targets.length;
    const verified = targets.filter(t => t.verified).length;
    const totalChecks = targets.reduce((s, t) => s + t.health.total, 0);
    const passedChecks = targets.reduce((s, t) => s + t.health.passed, 0);
    const failedChecks = targets.reduce((s, t) => s + t.health.failed, 0);
    return { total_targets: total, verified_targets: verified, total_checks: totalChecks, passed_checks: passedChecks, failed_checks: failedChecks, health_percentage: totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0 };
  }

  async _saveReport(results) {
    if (!fs.existsSync(this.outputDir)) fs.mkdirSync(this.outputDir, { recursive: true });
    const filename = `e2e-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(this.outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
    const latestPath = path.join(this.outputDir, 'latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(results, null, 2));
    return filepath;
  }
}
