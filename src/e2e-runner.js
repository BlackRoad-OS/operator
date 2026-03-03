import fs from 'node:fs';
import { scrapeAll } from './scraper.js';
import { REPOS, SCRAPE_RESULTS_FILE, E2E_RESULTS_FILE, DATA_DIR } from './config.js';

class E2ERunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.skipped = 0;
    this.recoverySteps = [];
  }

  test(name, fn) { this.tests.push({ name, fn }); }

  async run() {
    const results = { run_id: `e2e-${Date.now()}`, started_at: new Date().toISOString(), tests: [], recovery_steps: [] };
    console.log(`\n[e2e] Running ${this.tests.length} E2E tests...\n`);

    for (const t of this.tests) {
      const start = Date.now();
      try {
        await t.fn();
        const duration = Date.now() - start;
        this.passed++;
        results.tests.push({ name: t.name, status: 'PASS', duration_ms: duration });
        console.log(`  PASS  ${t.name} (${duration}ms)`);
      } catch (err) {
        const duration = Date.now() - start;
        this.failed++;
        const recovery = this.getRecoveryStep(t.name, err.message);
        results.tests.push({ name: t.name, status: 'FAIL', error: err.message, duration_ms: duration, recovery });
        if (recovery) { this.recoverySteps.push(recovery); results.recovery_steps.push(recovery); }
        console.log(`  FAIL  ${t.name} (${duration}ms)`);
        console.log(`        Error: ${err.message}`);
        if (recovery) console.log(`        Recovery: ${recovery.action}`);
      }
    }

    results.completed_at = new Date().toISOString();
    results.summary = {
      total: this.tests.length, passed: this.passed, failed: this.failed, skipped: this.skipped,
      pass_rate: this.tests.length > 0 ? `${((this.passed / this.tests.length) * 100).toFixed(1)}%` : '0%',
      recovery_steps_generated: this.recoverySteps.length,
    };
    console.log(`\n[e2e] Results: ${this.passed} passed, ${this.failed} failed, ${this.skipped} skipped`);
    return results;
  }

  getRecoveryStep(testName, errorMessage) {
    if (errorMessage.includes('HTTP 403') || errorMessage.includes('rate limit')) {
      return { severity: 'high', action: 'Set GITHUB_TOKEN env var to avoid rate limiting.', automated: false };
    }
    if (errorMessage.includes('HTTP 404')) {
      return { severity: 'critical', action: `Repo in "${testName}" may have been renamed or deleted.`, automated: false };
    }
    return { severity: 'medium', action: `Investigate failure in "${testName}": ${errorMessage}`, automated: false };
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export async function runE2E(preScrapeData) {
  const runner = new E2ERunner();
  let scrapeData = null;

  runner.test('scraper:executes-without-crash', async () => {
    if (preScrapeData) { scrapeData = preScrapeData; }
    else if (fs.existsSync(SCRAPE_RESULTS_FILE)) { scrapeData = JSON.parse(fs.readFileSync(SCRAPE_RESULTS_FILE, 'utf8')); }
    else { scrapeData = await scrapeAll(); }
    assert(scrapeData !== null, 'scrapeAll returned null');
    assert(scrapeData.repos, 'No repos array in results');
  });

  runner.test('scraper:returns-all-5-repos', async () => {
    assert(scrapeData, 'No scrape data available');
    assert(scrapeData.repos.length === REPOS.length, `Expected ${REPOS.length} repos, got ${scrapeData.repos.length}`);
  });

  const results = await runner.run();
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(E2E_RESULTS_FILE, JSON.stringify(results, null, 2));
  return results;
}

export { E2ERunner };
