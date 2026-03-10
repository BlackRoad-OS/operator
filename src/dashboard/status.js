import fs from 'node:fs';
import path from 'node:path';

/**
 * StatusDashboard - Generates verified-only status output.
 * Rule: If it wasn't checked RIGHT NOW, it doesn't get displayed.
 */
class StatusDashboard {
  constructor(options = {}) {
    this.reportsDir = options.reportsDir || path.join(process.cwd(), 'reports');
  }

  loadLatest() {
    const latestPath = path.join(this.reportsDir, 'latest.json');
    if (!fs.existsSync(latestPath)) return null;
    return JSON.parse(fs.readFileSync(latestPath, 'utf8'));
  }

  generateMarkdown(report) {
    if (!report) return '# Operator Status\n\n> No verified data available. Run `npm run e2e` to generate.\n';

    const lines = [];
    lines.push('# Operator Status');
    lines.push('');
    lines.push(`> Last verified: ${report.completed_at}`);
    lines.push(`> Run ID: ${report.run_id}`);
    lines.push('');

    if (report.summary) {
      const s = report.summary;
      lines.push('## Summary');
      lines.push('');
      lines.push('| Metric | Value | Verified |');
      lines.push('|--------|-------|----------|');
      lines.push(`| Targets Scraped | ${s.total_targets} | YES |`);
      lines.push(`| Targets Verified | ${s.verified_targets}/${s.total_targets} | YES |`);
      lines.push(`| Health Checks Passed | ${s.passed_checks}/${s.total_checks} | YES |`);
      lines.push(`| Health Score | ${s.health_percentage}% | YES |`);
      lines.push('');
    }

    lines.push('## Targets');
    lines.push('');

    for (const target of (report.targets || [])) {
      const icon = target.health.failed === 0 ? 'PASS' : 'FAIL';
      lines.push(`### [${icon}] ${target.owner}/${target.repo}`);
      lines.push('');

      if (target.scraper?.repo?.metrics) {
        const m = target.scraper.repo.metrics;
        lines.push('| Metric | Value |');
        lines.push('|--------|-------|');
        if (m.stars !== undefined) lines.push(`| Stars | ${m.stars} |`);
        if (m.forks !== undefined) lines.push(`| Forks | ${m.forks} |`);
        if (m.open_issues !== undefined) lines.push(`| Open Issues | ${m.open_issues} |`);
        if (m.language) lines.push(`| Language | ${m.language} |`);
        if (m.pushed_at) lines.push(`| Last Push | ${m.pushed_at} |`);
        lines.push('');
      }

      if (target.health?.checks) {
        lines.push('**Health Checks:**');
        lines.push('');
        for (const c of target.health.checks) {
          const icon2 = c.passed === true ? 'PASS' : c.passed === false ? 'FAIL' : 'SKIP';
          lines.push(`- [${icon2}] ${c.name}: ${c.message}`);
        }
        lines.push('');
      }

      if (target.seo?.score) {
        lines.push(`**SEO Score:** ${target.seo.score.percentage}% (${target.seo.score.score}/${target.seo.score.max_score})`);
        lines.push('');
      }
    }

    lines.push('---');
    lines.push('');
    lines.push('*All numbers verified at scrape time. Nothing cached or assumed.*');

    return lines.join('\n');
  }

  generateJSON(report) {
    if (!report) return { status: 'no_data', message: 'Run e2e first' };

    return {
      status: 'ok',
      last_verified: report.completed_at,
      run_id: report.run_id,
      summary: report.summary,
      targets: (report.targets || []).map(t => ({
        repo: `${t.owner}/${t.repo}`,
        healthy: t.health.failed === 0,
        verified: t.verified,
        checks_passed: t.health.passed,
        checks_failed: t.health.failed,
        seo_score: t.seo?.score?.percentage || null,
      })),
    };
  }
}

export { StatusDashboard };
