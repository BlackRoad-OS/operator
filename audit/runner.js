#!/usr/bin/env node
/**
 * infra-audit runner
 *
 * Deterministic repository audit. Exits 0 on pass, 1 on any failure.
 * Produces audit/output-public.json (safe to publish) and
 * audit/output-private.json (full detail, not for public exposure).
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ── Check definitions ────────────────────────────────────────────────────────

const REQUIRED_FILES = [
  'README.md',
  'LICENSE',
  'CONTRIBUTING.md',
  'CODE_OF_CONDUCT.md',
  '.github/PULL_REQUEST_TEMPLATE.md',
];

const REQUIRED_WORKFLOW_JOBS = [
  { file: '.github/workflows/audit.yml', job: 'infra-audit' },
];

// Patterns that must NOT appear in tracked files (basic secret scan).
const FORBIDDEN_PATTERNS = [
  { label: 'private-key', re: /-----BEGIN (RSA|EC|DSA|OPENSSH) PRIVATE KEY-----/ },
  { label: 'aws-key-id', re: /(?<![A-Za-z0-9])(AKIA|ABIA|ACCA)[A-Z0-9]{16}(?![A-Za-z0-9])/ },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function readText(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function checkRequiredFiles() {
  const results = [];
  for (const f of REQUIRED_FILES) {
    const ok = exists(f);
    results.push({ check: `required-file:${f}`, pass: ok, detail: ok ? 'present' : 'MISSING' });
  }
  return results;
}

function checkWorkflowJobs() {
  const results = [];
  for (const { file, job } of REQUIRED_WORKFLOW_JOBS) {
    if (!exists(file)) {
      results.push({ check: `workflow-job:${job}`, pass: false, detail: `workflow file ${file} not found` });
      continue;
    }
    const content = readText(file);
    const hasJob = new RegExp(`^\\s+${job}:`, 'm').test(content);
    results.push({
      check: `workflow-job:${job}`,
      pass: hasJob,
      detail: hasJob ? 'job present' : `job "${job}" not found in ${file}`,
    });
  }
  return results;
}

function checkNoForbiddenPatterns() {
  const results = [];
  // Only scan files tracked by git (avoid scanning .git itself).
  const { execSync } = require('child_process');
  let trackedFiles;
  try {
    trackedFiles = execSync('git ls-files', { cwd: ROOT }).toString().trim().split('\n').filter(Boolean);
  } catch {
    results.push({ check: 'secret-scan', pass: false, detail: 'git ls-files failed' });
    return results;
  }

  const hits = [];
  for (const rel of trackedFiles) {
    let content;
    try {
      content = readText(rel);
    } catch {
      continue; // binary / unreadable file
    }
    const lines = content.split('\n');
    for (const { label, re } of FORBIDDEN_PATTERNS) {
      for (let i = 0; i < lines.length; i++) {
        if (re.test(lines[i])) {
          hits.push({ file: rel, pattern: label, line: i + 1 });
          break; // one hit per pattern per file is enough
        }
      }
    }
  }

  results.push({
    check: 'secret-scan',
    pass: hits.length === 0,
    detail: hits.length === 0
      ? 'no forbidden patterns found'
      : hits.map(h => `${h.file}:${h.line} (${h.pattern})`).join(', '),
  });
  return results;
}

// ── Run ──────────────────────────────────────────────────────────────────────

function run() {
  const allResults = [
    ...checkRequiredFiles(),
    ...checkWorkflowJobs(),
    ...checkNoForbiddenPatterns(),
  ];

  const failures = allResults.filter(r => !r.pass);
  const passed = allResults.filter(r => r.pass);

  const summary = {
    timestamp: new Date().toISOString(),
    total: allResults.length,
    passed: passed.length,
    failed: failures.length,
    status: failures.length === 0 ? 'PASS' : 'FAIL',
  };

  // Public output — status + pass/fail per check, no sensitive detail on failures
  const publicOutput = {
    ...summary,
    checks: allResults.map(r => ({ check: r.check, pass: r.pass })),
  };

  // Private output — full detail including failure reasons
  const privateOutput = {
    ...summary,
    checks: allResults,
  };

  const outDir = path.join(ROOT, 'audit');
  try {
    fs.writeFileSync(path.join(outDir, 'output-public.json'), JSON.stringify(publicOutput, null, 2));
    fs.writeFileSync(path.join(outDir, 'output-private.json'), JSON.stringify(privateOutput, null, 2));
  } catch (err) {
    console.error(`Failed to write audit output: ${err.message}`);
    process.exit(1);
  }

  // Always print a human-readable summary to stdout
  console.log(`\ninfra-audit  ${summary.status}  (${summary.passed}/${summary.total} checks passed)\n`);
  if (failures.length > 0) {
    console.error('Failed checks:');
    for (const f of failures) {
      console.error(`  ✗ ${f.check} — ${f.detail}`);
    }
    console.error('');
  }

  process.exit(failures.length === 0 ? 0 : 1);
}

run();
