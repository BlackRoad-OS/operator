#!/usr/bin/env node
/**
 * BlackRoad Infrastructure Audit Runner
 *
 * Reads config/blackroad.json, runs infrastructure checks, writes:
 *   audit/output-private.json  – full detail
 *   audit/output-public.json   – counts only
 *
 * Exits 0 if all checks pass, 1 if any fail.
 */

const fs = require('fs');
const path = require('path');

const { checkGitHubOrg } = require('./checks/github');
const { checkDns } = require('./checks/dns');
const { checkHttps } = require('./checks/https');
const { checkSsl } = require('./checks/ssl');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'config', 'blackroad.json');
const OUT_DIR = path.join(ROOT, 'audit');
const PRIVATE_OUT = path.join(OUT_DIR, 'output-private.json');
const PUBLIC_OUT = path.join(OUT_DIR, 'output-public.json');

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`[ERROR] Config not found: ${CONFIG_PATH}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

function pad(str, len) {
  return String(str).padEnd(len);
}

function printSummary(results) {
  const checkW = 12;
  const targetW = 32;
  const statusW = 8;
  const detailW = 40;

  const sep = '-'.repeat(checkW + targetW + statusW + detailW + 9);
  console.log('\n' + sep);
  console.log(
    `| ${pad('CHECK', checkW)} | ${pad('TARGET', targetW)} | ${pad('STATUS', statusW)} | ${pad('DETAIL', detailW)} |`
  );
  console.log(sep);

  for (const r of results) {
    const status = r.pass ? 'PASS' : 'FAIL';
    console.log(
      `| ${pad(r.check, checkW)} | ${pad(r.target, targetW)} | ${pad(status, statusW)} | ${pad(r.detail || '', detailW)} |`
    );
  }

  console.log(sep + '\n');

  const total = results.length;
  const passed = results.filter((r) => r.pass).length;
  const failed = total - passed;
  console.log(`Audit complete: ${passed}/${total} passed, ${failed} failed.\n`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const config = loadConfig();
  const { enterprise, orgs = [], domains = [] } = config;

  console.log(`\nBlackRoad Audit Runner — ${enterprise}`);
  console.log(`Orgs: ${orgs.join(', ')} | Domains: ${domains.join(', ')}\n`);

  const tasks = [];

  for (const org of orgs) {
    tasks.push(checkGitHubOrg(org));
  }

  for (const domain of domains) {
    tasks.push(checkDns(domain));
    tasks.push(checkHttps(domain));
    tasks.push(checkSsl(domain));
  }

  const results = await Promise.all(tasks);

  printSummary(results);

  // Write private output (full detail)
  const privatePayload = {
    enterprise,
    runAt: new Date().toISOString(),
    results,
  };
  fs.writeFileSync(PRIVATE_OUT, JSON.stringify(privatePayload, null, 2));

  // Write public output (counts only, no sensitive detail)
  const total = results.length;
  const passed = results.filter((r) => r.pass).length;
  const failed = total - passed;
  const publicPayload = {
    enterprise,
    runAt: privatePayload.runAt,
    summary: { total, passed, failed },
    checks: results.map((r) => ({
      check: r.check,
      target: r.target,
      pass: r.pass,
    })),
  };
  fs.writeFileSync(PUBLIC_OUT, JSON.stringify(publicPayload, null, 2));

  console.log(`Private output → ${PRIVATE_OUT}`);
  console.log(`Public output  → ${PUBLIC_OUT}\n`);

  if (failed > 0) {
    console.error(`[FAIL] ${failed} check(s) failed. Exiting with code 1.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
