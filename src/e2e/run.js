#!/usr/bin/env node

import { E2ERunner } from './runner.js';
import { StatusDashboard } from '../dashboard/status.js';
import { readFileSync } from 'node:fs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const targets = JSON.parse(readFileSync(path.join(__dirname, '../../config/targets.json'), 'utf8'));

async function main() {
  console.log('=== BlackRoad Operator E2E Runner ===');
  console.log(`Targets: ${targets.targets.length}`);
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('');

  const runner = new E2ERunner({
    targets: targets.targets,
    scraper: { token: process.env.GITHUB_TOKEN },
  });

  const results = await runner.runAll();

  console.log('');
  console.log('=== Results ===');
  console.log(`Run ID: ${results.run_id}`);
  console.log(`Completed: ${results.completed_at}`);

  if (results.summary) {
    console.log(`Targets: ${results.summary.verified_targets}/${results.summary.total_targets} verified`);
    console.log(`Health: ${results.summary.passed_checks}/${results.summary.total_checks} checks passed (${results.summary.health_percentage}%)`);
  }

  console.log('');
  for (const target of results.targets) {
    const icon = target.health.failed === 0 ? 'PASS' : 'FAIL';
    console.log(`[${icon}] ${target.owner}/${target.repo} - ${target.health.passed}/${target.health.total} checks`);
    for (const check of target.health.checks) {
      const ci = check.passed === true ? '  +' : check.passed === false ? '  -' : '  ?';
      console.log(`${ci} ${check.name}: ${check.message}`);
    }
  }

  // Generate dashboard
  const dashboard = new StatusDashboard();
  const md = dashboard.generateMarkdown(results);

  // Update STATUS.md (NOT README.md - README stays clean)
  const statusPath = path.join(process.cwd(), 'STATUS.md');
  fs.writeFileSync(statusPath, md);
  console.log('');
  console.log(`Status written to: ${statusPath}`);

  // Exit with failure code if any health checks failed
  const exitCode = results.summary?.failed_checks > 0 ? 1 : 0;
  if (exitCode !== 0) {
    console.log(`\nFailed checks detected. Exit code: ${exitCode}`);
  }
  process.exit(exitCode);
}

main().catch(err => {
  console.error('E2E run failed:', err);
  process.exit(2);
});
