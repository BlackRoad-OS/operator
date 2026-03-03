import { scrapeAll } from './scraper.js';
import { runE2E } from './e2e-runner.js';
import { updateReadme } from './readme-updater.js';
import fs from 'node:fs';
import { DATA_DIR } from './config.js';

async function runPipeline() {
  const report = { pipeline_id: `pipeline-${Date.now()}`, started_at: new Date().toISOString(), stages: [] };

  console.log('='.repeat(60));
  console.log('  BlackRoad OS — Multi-Repo E2E Pipeline');
  console.log('='.repeat(60));

  // Stage 1: Scrape
  console.log('[pipeline] Stage 1/4: Scraping repos...');
  const scrapeStart = Date.now();
  let scrapeData;
  try {
    scrapeData = await scrapeAll();
    report.stages.push({ name: 'scrape', status: 'success', duration_ms: Date.now() - scrapeStart });
  } catch (err) {
    report.stages.push({ name: 'scrape', status: 'failed', duration_ms: Date.now() - scrapeStart, error: err.message });
    writeReport(report);
    process.exit(1);
  }

  // Stage 2: E2E Tests
  console.log('\n[pipeline] Stage 2/4: Running E2E tests...');
  const e2eStart = Date.now();
  let e2eResults;
  try {
    e2eResults = await runE2E(scrapeData);
    report.stages.push({ name: 'e2e', status: e2eResults.summary.failed === 0 ? 'success' : 'partial', duration_ms: Date.now() - e2eStart });
  } catch (err) {
    report.stages.push({ name: 'e2e', status: 'failed', duration_ms: Date.now() - e2eStart, error: err.message });
    writeReport(report);
    process.exit(1);
  }

  // Stage 3: Update README
  console.log('\n[pipeline] Stage 3/4: Updating README...');
  if (scrapeData.summary.verified_repos > 0) {
    try { updateReadme(); report.stages.push({ name: 'readme_update', status: 'success' }); }
    catch (err) { report.stages.push({ name: 'readme_update', status: 'failed', error: err.message }); }
  } else {
    report.stages.push({ name: 'readme_update', status: 'skipped', reason: 'No verified repos' });
  }

  report.completed_at = new Date().toISOString();
  report.overall_status = report.stages.every(s => s.status === 'success') ? 'success' : 'partial';
  writeReport(report);
  return report;
}

function writeReport(report) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(`${DATA_DIR}/pipeline-report.json`, JSON.stringify(report, null, 2));
}

export { runPipeline };
