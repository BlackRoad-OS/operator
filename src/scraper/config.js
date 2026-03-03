/**
 * Scraper configuration — delegates to the canonical e2e.config.js.
 *
 * All target repos, timeouts, and retry config live in e2e.config.js.
 * This file re-exports them so existing imports don't break.
 */

import {
  ORG as _ORG,
  TARGETS,
  GITHUB_API as _GITHUB_API,
  SCRAPE,
  OUTPUT,
} from "../../e2e.config.js";

export const ORG = _ORG;

export const REPOS = TARGETS.map((t) => ({
  name: t.name,
  description: t.description,
  checks: t.checks,
}));

export const GITHUB_API = _GITHUB_API;

export const OUTPUT_DIR = OUTPUT.dataDir;

export const SCRAPE_TIMEOUT_MS = SCRAPE.timeoutMs;

export const RETRY = SCRAPE.retry;
