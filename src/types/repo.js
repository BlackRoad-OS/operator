/**
 * @typedef {Object} RepoMetrics
 * @property {string} name
 * @property {string} full_name
 * @property {string} description
 * @property {string|null} language
 * @property {number} stars
 * @property {number} forks
 * @property {number} open_issues
 * @property {number} watchers
 * @property {number} size_kb
 * @property {string} default_branch
 * @property {string} created_at
 * @property {string} updated_at
 * @property {string} pushed_at
 * @property {string[]} topics
 * @property {string|null} license
 * @property {string} html_url
 * @property {Object<string, number>} languages
 * @property {string} last_commit_message
 * @property {string} last_commit_date
 * @property {Array<{login: string, contributions: number}>} contributors
 * @property {number} scraped_at - Unix timestamp of when this was scraped
 */

/**
 * @typedef {Object} ScrapeResult
 * @property {boolean} success
 * @property {RepoMetrics|null} data
 * @property {string|null} error
 * @property {number} duration_ms
 */

export const REPO_TARGETS = [
  "BlackRoad-OS/blackroad",
  "BlackRoad-OS/blackroad-os-core",
  "BlackRoad-OS/blackroad-os-api",
  "BlackRoad-OS/blackroad-os-web",
  "BlackRoad-OS/blackroad-os-prism-console",
];
