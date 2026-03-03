#!/usr/bin/env node

import { E2ERunner } from './runner.js';
import { StatusDashboard } from '../dashboard/status.js';
import targets from '../../config/targets.json' with { type: 'json' };
import fs from 'node:fs';
import path from 'node:path';

async function main() {
  console.log('=== BlackRoad Operator E2E Runner ===');
  console.log(`Targets: ${targets.targets.length}`);
  console.log(`Started: ${new Date().toISOString()}`);

  const runner = new E2ERunner({
    targets: targets.targets,
    scraper: { token: process.env.GITHUB_TOKEN },
  });

  const results = await runner.runAll();

  console.log('');
  console.log('=== Results ===');
  console.log(`Run ID: ${results.run_id}`);

  const dashboard = new StatusDashboard();
  const md = dashboard.generateMarkdown(results);
  const statusPath = path.join(process.cwd(), 'STATUS.md');
  fs.writeFileSync(statusPath, md);
  console.log(`Status written to: ${statusPath}`);

  const exitCode = results.summary?.failed_checks > 0 ? 1 : 0;
  process.exit(exitCode);
}

main().catch(err => {
  console.error('E2E run failed:', err);
  process.exit(2);
});
