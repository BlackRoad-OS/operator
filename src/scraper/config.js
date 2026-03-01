/**
 * Scraper configuration — 5 target repos in the BlackRoad-OS universe.
 *
 * Each entry defines what we scrape, what we verify, and what counts
 * as a passing E2E check.
 */

export const ORG = "BlackRoad-OS";

export const REPOS = [
  {
    name: "operator",
    description: "Control center and E2E orchestrator",
    checks: ["exists", "license", "has_commits", "api_reachable"],
  },
  {
    name: "blackroad-web-scraper",
    description: "Web scraping infrastructure",
    checks: ["exists", "license", "has_commits", "api_reachable"],
  },
  {
    name: "blackroad-os-core",
    description: "Core OS system",
    checks: ["exists", "license", "has_commits", "api_reachable"],
  },
  {
    name: "blackroad-sync-engine",
    description: "Sync infrastructure",
    checks: ["exists", "license", "has_commits", "api_reachable"],
  },
  {
    name: "blackroad-a-b-testing",
    description: "A/B testing infrastructure",
    checks: ["exists", "license", "has_commits", "api_reachable"],
  },
];

export const GITHUB_API = "https://api.github.com";

export const OUTPUT_DIR = "data";

export const SCRAPE_TIMEOUT_MS = 15_000;

export const RETRY = {
  maxAttempts: 4,
  backoffMs: [2000, 4000, 8000, 16000],
};
