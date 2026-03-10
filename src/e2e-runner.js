import fs from 'node:fs';
import { scrapeAll } from './scraper.js';
import { REPOS, SCRAPE_RESULTS_FILE, E2E_RESULTS_FILE, DATA_DIR } from './config.js';

/**
 * E2E test suite for multi-repo scraper.
 * Tests are assertions on live-scraped data.
 * Failures trigger recovery steps, not silent passes.
 */

class E2ERunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.skipped = 0;
    this.recoverySteps = [];
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    const results = {
      run_id: `e2e-${Date.now()}`,
      started_at: new Date().toISOString(),
      tests: [],
      recovery_steps: [],
    };

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
        results.tests.push({
          name: t.name,
          status: 'FAIL',
          error: err.message,
          duration_ms: duration,
          recovery,
        });
        if (recovery) {
          this.recoverySteps.push(recovery);
          results.recovery_steps.push(recovery);
        }
        console.log(`  FAIL  ${t.name} (${duration}ms)`);
        console.log(`        Error: ${err.message}`);
        if (recovery) {
          console.log(`        Recovery: ${recovery.action}`);
        }
      }
    }

    results.completed_at = new Date().toISOString();
    results.summary = {
      total: this.tests.length,
      passed: this.passed,
      failed: this.failed,
      skipped: this.skipped,
      pass_rate: this.tests.length > 0
        ? `${((this.passed / this.tests.length) * 100).toFixed(1)}%`
        : '0%',
      recovery_steps_generated: this.recoverySteps.length,
    };

    console.log(`\n[e2e] Results: ${this.passed} passed, ${this.failed} failed, ${this.skipped} skipped`);
    console.log(`[e2e] Pass rate: ${results.summary.pass_rate}`);

    if (this.recoverySteps.length > 0) {
      console.log(`\n[e2e] Recovery steps needed:`);
      for (const step of this.recoverySteps) {
        console.log(`  -> [${step.severity}] ${step.action}`);
      }
    }

    return results;
  }

  getRecoveryStep(testName, errorMessage) {
    if (errorMessage.includes('HTTP 403') || errorMessage.includes('rate limit') || errorMessage.includes('rate-limited')) {
      return {
        severity: 'high',
        action: 'Set GITHUB_TOKEN env var to avoid rate limiting. Generate at github.com/settings/tokens.',
        automated: false,
      };
    }
    if (errorMessage.includes('HTTP 404')) {
      return {
        severity: 'critical',
        action: `Repo referenced in test "${testName}" may have been renamed or deleted. Update config.js.`,
        automated: false,
      };
    }
    if (errorMessage.includes('not verified')) {
      return {
        severity: 'medium',
        action: `Re-run scraper for "${testName}" — data may be stale or API was temporarily unavailable.`,
        automated: true,
      };
    }
    if (errorMessage.includes('no commits')) {
      return {
        severity: 'low',
        action: `Repo has no commits — may be newly created. Check if initialization is needed.`,
        automated: false,
      };
    }
    return {
      severity: 'medium',
      action: `Investigate failure in "${testName}": ${errorMessage}`,
      automated: false,
    };
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/**
 * Main E2E flow:
 * 1. Use pre-scraped data or scrape live
 * 2. Validate every piece of scraped data
 * 3. Cross-check repos against each other
 * 4. Verify data integrity
 * 5. Report with recovery steps
 *
 * @param {object} [preScrapeData] - If provided, skip scraping and use this data.
 */
async function runE2E(preScrapeData) {
  const runner = new E2ERunner();

  // ---- Phase 1: Scraper execution ----

  let scrapeData = null;

  runner.test('scraper:executes-without-crash', async () => {
    if (preScrapeData) {
      scrapeData = preScrapeData;
    } else if (fs.existsSync(SCRAPE_RESULTS_FILE)) {
      scrapeData = JSON.parse(fs.readFileSync(SCRAPE_RESULTS_FILE, 'utf8'));
    } else {
      scrapeData = await scrapeAll();
    }
    assert(scrapeData !== null, 'scrapeAll returned null');
    assert(scrapeData.repos, 'No repos array in results');
  });

  runner.test('scraper:returns-all-5-repos', async () => {
    assert(scrapeData, 'No scrape data available');
    assert(
      scrapeData.repos.length === REPOS.length,
      `Expected ${REPOS.length} repos, got ${scrapeData.repos.length}`
    );
  });

  runner.test('scraper:results-file-written', async () => {
    assert(fs.existsSync(SCRAPE_RESULTS_FILE), `Results file not found at ${SCRAPE_RESULTS_FILE}`);
    const raw = fs.readFileSync(SCRAPE_RESULTS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    assert(parsed.repos, 'Persisted file missing repos array');
  });

  // ---- Phase 2: Per-repo validation ----

  for (const repo of REPOS) {
    const slug = `${repo.owner}/${repo.name}`;

    runner.test(`repo:${slug}:metadata-present`, async () => {
      assert(scrapeData, 'No scrape data');
      const r = scrapeData.repos.find(r => r.slug === slug);
      assert(r, `Repo ${slug} not found in results`);
      assert(r.data.metadata, `${slug} missing metadata`);
      assert(typeof r.data.metadata.full_name === 'string', `${slug} full_name not a string`);
      assert(typeof r.data.metadata.size_kb === 'number', `${slug} size not a number`);
    });

    runner.test(`repo:${slug}:is-verified`, async () => {
      const r = scrapeData.repos.find(r => r.slug === slug);
      assert(r, `Repo ${slug} not found`);
      assert(r.verified === true, `${slug} data not verified — had errors: ${JSON.stringify(r.errors)}`);
    });

    runner.test(`repo:${slug}:has-commits`, async () => {
      const r = scrapeData.repos.find(r => r.slug === slug);
      assert(r, `Repo ${slug} not found`);
      // If commits endpoint was rate-limited, check errors to distinguish
      const commitErr = r.errors.find(e => e.endpoint === 'commits');
      if (commitErr) {
        assert(false, `${slug} commits endpoint failed (likely rate-limited): ${commitErr.error}`);
      }
      assert(
        r.data.recent_commits && r.data.recent_commits.length > 0,
        `${slug} has no commits — repo may be empty`
      );
    });

    runner.test(`repo:${slug}:languages-detected`, async () => {
      const r = scrapeData.repos.find(r => r.slug === slug);
      assert(r, `Repo ${slug} not found`);
      const langErr = r.errors.find(e => e.endpoint === 'languages');
      if (langErr) {
        assert(false, `${slug} languages endpoint failed (likely rate-limited): ${langErr.error}`);
      }
      assert(r.data.languages, `${slug} missing languages data`);
      assert(Object.keys(r.data.languages).length > 0, `${slug} has zero languages detected`);
    });

    runner.test(`repo:${slug}:not-archived`, async () => {
      const r = scrapeData.repos.find(r => r.slug === slug);
      assert(r, `Repo ${slug} not found`);
      if (!r.data.metadata) {
        // Metadata endpoint was rate-limited — this is tested by metadata-present
        assert(false, `${slug} metadata unavailable (rate-limited) — cannot check archived status`);
      }
      assert(r.data.metadata.archived === false, `${slug} is archived — should it be?`);
    });

    runner.test(`repo:${slug}:not-disabled`, async () => {
      const r = scrapeData.repos.find(r => r.slug === slug);
      assert(r, `Repo ${slug} not found`);
      if (!r.data.metadata) {
        assert(false, `${slug} metadata unavailable (rate-limited) — cannot check disabled status`);
      }
      assert(r.data.metadata.disabled === false, `${slug} is disabled`);
    });
  }

  // ---- Phase 3: Cross-repo checks ----

  runner.test('cross:all-repos-same-owner', async () => {
    assert(scrapeData, 'No scrape data');
    const owners = scrapeData.repos.map(r => r.data.metadata && r.data.metadata.full_name ? r.data.metadata.full_name.split('/')[0] : null);
    const uniqueOwners = [...new Set(owners.filter(Boolean))];
    assert(uniqueOwners.length === 1, `Expected 1 owner, got ${uniqueOwners.length}: ${uniqueOwners.join(', ')}`);
  });

  runner.test('cross:at-least-one-typescript-repo', async () => {
    assert(scrapeData, 'No scrape data');
    const tsRepos = scrapeData.repos.filter(r => r.data.metadata && r.data.metadata.language === 'TypeScript');
    assert(tsRepos.length > 0, 'No TypeScript repos found — blackroad monorepo should be TypeScript');
  });

  runner.test('cross:all-repos-recently-active', async () => {
    assert(scrapeData, 'No scrape data');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    for (const r of scrapeData.repos) {
      if (!r.data.metadata) continue;
      const pushed = new Date(r.data.metadata.pushed_at);
      assert(
        pushed > thirtyDaysAgo,
        `${r.slug} last pushed ${r.data.metadata.pushed_at} — more than 30 days ago`
      );
    }
  });

  // ---- Phase 4: Data integrity ----

  runner.test('integrity:summary-matches-data', async () => {
    assert(scrapeData, 'No scrape data');
    const verified = scrapeData.repos.filter(r => r.verified);
    assert(
      scrapeData.summary.verified_repos === verified.length,
      `Summary says ${scrapeData.summary.verified_repos} verified but found ${verified.length}`
    );
    const totalIssues = verified.reduce((sum, r) => sum + (r.data.metadata ? r.data.metadata.open_issues : 0), 0);
    assert(
      scrapeData.summary.total_open_issues === totalIssues,
      `Summary issues ${scrapeData.summary.total_open_issues} != computed ${totalIssues}`
    );
  });

  runner.test('integrity:no-future-timestamps', async () => {
    assert(scrapeData, 'No scrape data');
    const now = new Date();
    for (const r of scrapeData.repos) {
      const scraped = new Date(r.scraped_at);
      assert(scraped <= now, `${r.slug} scraped_at is in the future: ${r.scraped_at}`);
    }
  });

  runner.test('integrity:json-roundtrips', async () => {
    const raw = fs.readFileSync(SCRAPE_RESULTS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const reparsed = JSON.parse(JSON.stringify(parsed));
    assert(
      JSON.stringify(parsed) === JSON.stringify(reparsed),
      'JSON roundtrip produced different output'
    );
  });

  // ---- Run all tests ----

  const results = await runner.run();

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(E2E_RESULTS_FILE, JSON.stringify(results, null, 2));
  console.log(`\n[e2e] Full results written to ${E2E_RESULTS_FILE}`);

  return results;
}

if (process.argv[1]?.endsWith('e2e-runner.js')) {
  runE2E().then(results => {
    process.exit(results.summary.failed > 0 ? 1 : 0);
  }).catch(err => {
    console.error('[e2e] Fatal:', err.message);
    process.exit(1);
  });
}

export { runE2E, E2ERunner };
