/**
 * e2e.config.js — Single source of truth for all E2E testing.
 *
 * Every test file, workflow, and runner reads from HERE.
 * No duplicate target lists. No conflicting configs.
 *
 * If a repo isn't in this file, it doesn't get tested.
 */

/** Organization we're testing against */
export const ORG = "BlackRoad-OS";

/** GitHub API base URL */
export const GITHUB_API = "https://api.github.com";

/**
 * Target repos for E2E scraping and validation.
 * These are the repos we scrape, verify, and report on.
 */
export const TARGETS = [
  {
    owner: "BlackRoad-OS",
    name: "operator",
    full_name: "BlackRoad-OS/operator",
    description: "Control center — E2E orchestrator and canonical config source",
    checks: ["exists", "license", "has_commits", "api_reachable"],
  },
  {
    owner: "BlackRoad-OS",
    name: "blackroad-web-scraper",
    full_name: "BlackRoad-OS/blackroad-web-scraper",
    description: "Web scraping infrastructure",
    checks: ["exists", "license", "has_commits", "api_reachable"],
  },
  {
    owner: "BlackRoad-OS",
    name: "blackroad-os-core",
    full_name: "BlackRoad-OS/blackroad-os-core",
    description: "Core OS system",
    checks: ["exists", "license", "has_commits", "api_reachable"],
  },
  {
    owner: "BlackRoad-OS",
    name: "blackroad-sync-engine",
    full_name: "BlackRoad-OS/blackroad-sync-engine",
    description: "Sync infrastructure",
    checks: ["exists", "license", "has_commits", "api_reachable"],
  },
  {
    owner: "BlackRoad-OS",
    name: "blackroad-a-b-testing",
    full_name: "BlackRoad-OS/blackroad-a-b-testing",
    description: "A/B testing infrastructure",
    checks: ["exists", "license", "has_commits", "api_reachable"],
  },
];

/** Scraper configuration */
export const SCRAPE = {
  timeoutMs: 15_000,
  retry: {
    maxAttempts: 4,
    backoffMs: [2000, 4000, 8000, 16000],
  },
};

/** Output directories */
export const OUTPUT = {
  dataDir: "data",
  reportsDir: "reports",
  seoDir: "data/seo",
};

/** Verification thresholds */
export const VERIFY = {
  maxDataAgeMs: 3600_000, // 1 hour
  maxDrift: 5,            // tolerance for count mismatches vs live API
};
