#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'audit');

function collectChecks() {
  const checks = [];

  // Check: repository root contains expected governance files
  const expectedFiles = ['README.md', 'LICENSE', 'CODE_OF_CONDUCT.md', 'CONTRIBUTING.md'];
  for (const file of expectedFiles) {
    const exists = fs.existsSync(path.join(ROOT, file));
    checks.push({
      id: `root.${file.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      description: `Repository root contains ${file}`,
      pass: exists,
    });
  }

  // Check: .github directory exists
  const githubDir = path.join(ROOT, '.github');
  checks.push({
    id: 'github.dir',
    description: '.github directory exists',
    pass: fs.existsSync(githubDir),
  });

  // Check: pull request template exists
  const prTemplate = path.join(githubDir, 'PULL_REQUEST_TEMPLATE.md');
  checks.push({
    id: 'github.pr_template',
    description: 'Pull request template exists',
    pass: fs.existsSync(prTemplate),
  });

  return checks;
}

function run() {
  const checks = collectChecks();
  const passed = checks.filter((c) => c.pass);
  const failed = checks.filter((c) => !c.pass);

  const summary = {
    timestamp: new Date().toISOString(),
    host: os.hostname(),
    total: checks.length,
    passed: passed.length,
    failed: failed.length,
    checks,
  };

  // Public output: omit host information
  const publicSummary = {
    timestamp: summary.timestamp,
    total: summary.total,
    passed: summary.passed,
    failed: summary.failed,
    checks,
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'output-private.json'), JSON.stringify(summary, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'output-public.json'), JSON.stringify(publicSummary, null, 2));

  if (failed.length > 0) {
    console.error(`audit: ${failed.length} check(s) failed:`);
    for (const check of failed) {
      console.error(`  ✗ [${check.id}] ${check.description}`);
    }
    process.exit(1);
  }

  console.log(`audit: all ${passed.length} check(s) passed`);
  process.exit(0);
}

run();
