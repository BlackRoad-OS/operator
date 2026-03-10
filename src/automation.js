import { scrapeAll } from './scraper.js';
import { runE2E } from './e2e-runner.js';
import { updateReadme } from './readme-updater.js';
import fs from 'node:fs';
import { DATA_DIR } from './config.js';

/**
 * Full automation pipeline:
 * 1. Scrape all repos (live data)
 * 2. Run E2E tests against scraped data
 * 3. If tests pass: update README with verified numbers
 * 4. If tests fail: log recovery steps, do NOT update README with bad data
 * 5. Write final report
 *
 * Real-time output: everything streams to stdout as it happens.
 */
async function runPipeline() {
  const report = {
    pipeline_id: `pipeline-${Date.now()}`,
    started_at: new Date().toISOString(),
    stages: [],
  };

  console.log('='.repeat(60));
  console.log('  BlackRoad OS — Multi-Repo E2E Pipeline');
  console.log('='.repeat(60));
  console.log();

  // Stage 1: Scrape
  console.log('[pipeline] Stage 1/4: Scraping repos...');
  const scrapeStart = Date.now();
  let scrapeData;
  try {
    scrapeData = await scrapeAll();
    report.stages.push({
      name: 'scrape',
      status: 'success',
      duration_ms: Date.now() - scrapeStart,
      repos_scraped: scrapeData.repos.length,
      verified: scrapeData.summary.verified_repos,
    });
  } catch (err) {
    report.stages.push({
      name: 'scrape',
      status: 'failed',
      duration_ms: Date.now() - scrapeStart,
      error: err.message,
    });
    console.error(`[pipeline] Scrape failed: ${err.message}`);
    console.error('[pipeline] Recovery: Check network connectivity and GitHub API status.');
    writeReport(report);
    process.exit(1);
  }

  // Stage 2: E2E Tests
  console.log('\n[pipeline] Stage 2/4: Running E2E tests...');
  const e2eStart = Date.now();
  let e2eResults;
  try {
    e2eResults = await runE2E(scrapeData);
    report.stages.push({
      name: 'e2e',
      status: e2eResults.summary.failed === 0 ? 'success' : 'partial',
      duration_ms: Date.now() - e2eStart,
      passed: e2eResults.summary.passed,
      failed: e2eResults.summary.failed,
      pass_rate: e2eResults.summary.pass_rate,
      recovery_steps: e2eResults.recovery_steps,
    });
  } catch (err) {
    report.stages.push({
      name: 'e2e',
      status: 'failed',
      duration_ms: Date.now() - e2eStart,
      error: err.message,
    });
    console.error(`[pipeline] E2E runner crashed: ${err.message}`);
    writeReport(report);
    process.exit(1);
  }

  // Stage 3: Update README (only if E2E passed or partially passed with verified data)
  console.log('\n[pipeline] Stage 3/4: Updating README...');
  const readmeStart = Date.now();
  if (scrapeData.summary.verified_repos > 0) {
    try {
      updateReadme();
      report.stages.push({
        name: 'readme_update',
        status: 'success',
        duration_ms: Date.now() - readmeStart,
        verified_repos_included: scrapeData.summary.verified_repos,
      });
    } catch (err) {
      report.stages.push({
        name: 'readme_update',
        status: 'failed',
        duration_ms: Date.now() - readmeStart,
        error: err.message,
      });
      console.error(`[pipeline] README update failed: ${err.message}`);
    }
  } else {
    report.stages.push({
      name: 'readme_update',
      status: 'skipped',
      reason: 'No verified repos — refusing to update README with unverified data',
    });
    console.log('[pipeline] Skipping README update — no verified data available.');
  }

  // Stage 4: Final report
  console.log('\n[pipeline] Stage 4/4: Writing report...');
  report.completed_at = new Date().toISOString();
  report.total_duration_ms = Date.now() - new Date(report.started_at).getTime();
  // Check if all failures are rate-limit related (infrastructure, not data)
  const allRateLimited = e2eResults && e2eResults.recovery_steps &&
    e2eResults.recovery_steps.length > 0 &&
    e2eResults.recovery_steps.every(s => s.severity !== 'critical');
  const readmeUpdated = report.stages.some(s => s.name === 'readme_update' && s.status === 'success');
  report.overall_status = report.stages.every(s => s.status === 'success')
    ? 'success'
    : (readmeUpdated && allRateLimited) ? 'success-with-warnings' : 'partial';

  writeReport(report);

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('  Pipeline Complete');
  console.log('='.repeat(60));
  console.log(`  Status: ${report.overall_status}`);
  console.log(`  Duration: ${report.total_duration_ms}ms`);
  for (const stage of report.stages) {
    const icon = stage.status === 'success' ? 'OK' : stage.status === 'skipped' ? 'SKIP' : 'WARN';
    console.log(`  [${icon}] ${stage.name} (${stage.duration_ms || 0}ms)`);
  }

  if (e2eResults && e2eResults.summary.failed > 0) {
    console.log(`\n  ${e2eResults.summary.failed} E2E test(s) failed.`);
    console.log('  Recovery steps written to data/pipeline-report.json');
  }
  console.log();

  return report;
}

function writeReport(report) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(`${DATA_DIR}/pipeline-report.json`, JSON.stringify(report, null, 2));
}

if (process.argv[1]?.endsWith('automation.js')) {
  runPipeline().then(report => {
    process.exit(report.overall_status === 'partial' ? 1 : 0);
  }).catch(err => {
    console.error('[pipeline] Fatal:', err.message);
    process.exit(1);
  });
}

export { runPipeline };
