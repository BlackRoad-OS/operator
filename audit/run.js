#!/usr/bin/env node

/**
 * BlackRoad Trust Architecture — Automated Verification Suite
 *
 * Reads config/blackroad.json, verifies each organization,
 * and writes structured results to audit/output.json.
 *
 * Usage:
 *   node audit/run.js
 *   node audit/run.js --verbose
 *
 * Environment:
 *   GITHUB_TOKEN  — optional, increases API rate limits
 */

import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "..");
const CONFIG_PATH = path.join(ROOT, "config", "blackroad.json");
const OUTPUT_PATH = path.join(ROOT, "audit", "output.json");

const VERBOSE = process.argv.includes("--verbose");
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || null;

function log(...args) {
  if (VERBOSE) console.log("[audit]", ...args);
}

function githubGet(urlPath) {
  return new Promise((resolve, reject) => {
    const headers = {
      "User-Agent": "blackroad-audit/1.0",
      Accept: "application/vnd.github.v3+json",
    };
    if (GITHUB_TOKEN) {
      headers.Authorization = `token ${GITHUB_TOKEN}`;
    }

    const options = {
      hostname: "api.github.com",
      path: urlPath,
      method: "GET",
      headers,
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        resolve({ status: res.statusCode, body, headers: res.headers });
      });
    });

    req.on("error", reject);
    req.setTimeout(10000, () => {
      req.destroy(new Error("Request timeout"));
    });
    req.end();
  });
}

async function checkOrgExists(orgName) {
  try {
    const res = await githubGet(`/orgs/${orgName}`);
    if (res.status === 200) {
      return { pass: true, detail: "Organization exists" };
    }
    if (res.status === 404) {
      return { pass: false, detail: "Organization not found (404)" };
    }
    return {
      pass: false,
      detail: `Unexpected status: ${res.status}`,
    };
  } catch (err) {
    return { pass: false, detail: `Network error: ${err.message}` };
  }
}

async function checkHasRepos(orgName) {
  try {
    const res = await githubGet(`/orgs/${orgName}/repos?per_page=1`);
    if (res.status === 200) {
      const repos = JSON.parse(res.body);
      if (repos.length > 0) {
        return { pass: true, detail: `Has repositories` };
      }
      return { pass: false, detail: "No public repositories found" };
    }
    return { pass: false, detail: `Could not fetch repos: ${res.status}` };
  } catch (err) {
    return { pass: false, detail: `Network error: ${err.message}` };
  }
}

async function checkRecentActivity(orgName) {
  try {
    const res = await githubGet(
      `/orgs/${orgName}/repos?sort=pushed&per_page=1`
    );
    if (res.status === 200) {
      const repos = JSON.parse(res.body);
      if (repos.length === 0) {
        return { pass: false, detail: "No repositories to check" };
      }
      const lastPush = new Date(repos[0].pushed_at);
      const daysAgo = Math.floor(
        (Date.now() - lastPush.getTime()) / (1000 * 60 * 60 * 24)
      );
      const threshold = 90;
      if (daysAgo <= threshold) {
        return {
          pass: true,
          detail: `Last push ${daysAgo} day(s) ago — ${repos[0].full_name}`,
        };
      }
      return {
        pass: false,
        detail: `Last push ${daysAgo} day(s) ago — exceeds ${threshold}-day threshold`,
      };
    }
    return {
      pass: false,
      detail: `Could not fetch repos: ${res.status}`,
    };
  } catch (err) {
    return { pass: false, detail: `Network error: ${err.message}` };
  }
}

async function checkHasReadme(orgName) {
  try {
    // Check for .github repo (org profile) or any repo with README
    const res = await githubGet(`/repos/${orgName}/.github/readme`);
    if (res.status === 200) {
      return { pass: true, detail: "Organization profile README found" };
    }
    // Fallback: check first repo
    const repoRes = await githubGet(
      `/orgs/${orgName}/repos?sort=updated&per_page=1`
    );
    if (repoRes.status === 200) {
      const repos = JSON.parse(repoRes.body);
      if (repos.length > 0) {
        const readmeRes = await githubGet(
          `/repos/${repos[0].full_name}/readme`
        );
        if (readmeRes.status === 200) {
          return {
            pass: true,
            detail: `README found in ${repos[0].full_name}`,
          };
        }
      }
    }
    return { pass: false, detail: "No README found" };
  } catch (err) {
    return { pass: false, detail: `Network error: ${err.message}` };
  }
}

async function auditOrg(org, checks) {
  log(`Auditing: ${org.name}`);
  const results = {};

  for (const check of checks) {
    let result;
    switch (check.id) {
      case "org_exists":
        result = await checkOrgExists(org.name);
        break;
      case "has_repos":
        result = await checkHasRepos(org.name);
        break;
      case "recent_activity":
        result = await checkRecentActivity(org.name);
        break;
      case "has_readme":
        result = await checkHasReadme(org.name);
        break;
      case "ssl_valid":
        // SSL check is domain-level, not per-org — marked as skipped here
        result = { pass: null, detail: "Domain-level check — see domain audit" };
        break;
      default:
        result = { pass: null, detail: `Unknown check: ${check.id}` };
    }

    results[check.id] = {
      ...result,
      severity: check.severity,
    };

    log(`  ${check.id}: ${result.pass ? "PASS" : result.pass === false ? "FAIL" : "SKIP"} — ${result.detail}`);
  }

  return results;
}

function computeHealth(orgResults, thresholds) {
  let critical = { total: 0, passed: 0 };
  let warning = { total: 0, passed: 0 };
  let all = { total: 0, passed: 0 };

  for (const [, result] of Object.entries(orgResults)) {
    if (result.pass === null) continue; // skip non-applicable checks

    all.total++;
    if (result.pass) all.passed++;

    if (result.severity === "critical") {
      critical.total++;
      if (result.pass) critical.passed++;
    } else if (result.severity === "warning") {
      warning.total++;
      if (result.pass) warning.passed++;
    }
  }

  const criticalRate = critical.total > 0 ? critical.passed / critical.total : 1;
  const warningRate = warning.total > 0 ? warning.passed / warning.total : 1;
  const overallRate = all.total > 0 ? all.passed / all.total : 0;

  return {
    critical_pass_rate: criticalRate,
    warning_pass_rate: warningRate,
    overall_rate: overallRate,
    critical_ok: criticalRate >= thresholds.critical_pass_rate,
    warning_ok: warningRate >= thresholds.warning_pass_rate,
    healthy: overallRate >= thresholds.overall_health_minimum,
  };
}

async function main() {
  console.log("BlackRoad Trust Audit — starting");
  console.log(`Timestamp: ${new Date().toISOString()}`);

  // Load config
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`Config not found: ${CONFIG_PATH}`);
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  const orgs = config.infrastructure.github_orgs;
  const checks = config.verification.checks;
  const thresholds = config.verification.thresholds;

  console.log(`Organizations: ${orgs.length}`);
  console.log(`Checks per org: ${checks.length}`);
  console.log("");

  const auditResults = {
    meta: {
      schema_version: config.schema_version,
      timestamp: new Date().toISOString(),
      runner: "audit/run.js",
      org_count: orgs.length,
      check_count: checks.length,
    },
    organizations: {},
    summary: {},
  };

  // Run all org audits
  for (const org of orgs) {
    const results = await auditOrg(org, checks);
    const health = computeHealth(results, thresholds);

    auditResults.organizations[org.name] = {
      role: org.role,
      url: org.url,
      checks: results,
      health,
    };

    const status = health.healthy ? "HEALTHY" : "DEGRADED";
    console.log(`  ${org.name} — ${status} (${(health.overall_rate * 100).toFixed(0)}%)`);
  }

  // Compute global summary
  const allHealthy = Object.values(auditResults.organizations).every(
    (o) => o.health.healthy
  );
  const healthyCount = Object.values(auditResults.organizations).filter(
    (o) => o.health.healthy
  ).length;

  auditResults.summary = {
    status: allHealthy ? "PASS" : "DEGRADED",
    healthy_orgs: healthyCount,
    total_orgs: orgs.length,
    health_rate: orgs.length > 0 ? healthyCount / orgs.length : 0,
    timestamp: new Date().toISOString(),
  };

  // Write output
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(auditResults, null, 2), "utf-8");
  console.log("");
  console.log(`Result: ${auditResults.summary.status}`);
  console.log(`Healthy: ${healthyCount}/${orgs.length}`);
  console.log(`Output: ${OUTPUT_PATH}`);

  // Exit with appropriate code
  if (!allHealthy) {
    const criticalFailures = Object.entries(auditResults.organizations).filter(
      ([, o]) => !o.health.critical_ok
    );
    if (criticalFailures.length > 0) {
      console.error(`\nCritical failures in: ${criticalFailures.map(([n]) => n).join(", ")}`);
      process.exit(1);
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Audit failed:", err.message);
  process.exit(1);
});
