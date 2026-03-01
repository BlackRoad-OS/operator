/**
 * Multi-repo scraper configuration.
 * These 5 repos span core infra, platform, API, templates, and showcase.
 */
const REPOS = [
  {
    owner: 'BlackRoad-OS',
    name: 'blackroad',
    role: 'core-monorepo',
    description: 'Core BlackRoad OS monorepo — governed AI operating system',
  },
  {
    owner: 'BlackRoad-OS',
    name: 'blackroad-os',
    role: 'enterprise-platform',
    description: 'Enterprise AI infrastructure platform',
  },
  {
    owner: 'BlackRoad-OS',
    name: 'blackroad-os-web',
    role: 'web-api',
    description: 'Web API — FastAPI backend for agent orchestration',
  },
  {
    owner: 'BlackRoad-OS',
    name: 'chanfana-openapi-template',
    role: 'api-template',
    description: 'OpenAPI service template for BlackRoad OS',
  },
  {
    owner: 'BlackRoad-OS',
    name: 'blackroad-os-demo',
    role: 'showcase',
    description: 'Demo and showcase repository',
  },
];

const GITHUB_API = 'https://api.github.com';
const DATA_DIR = './data';
const SCRAPE_RESULTS_FILE = `${DATA_DIR}/scrape-results.json`;
const E2E_RESULTS_FILE = `${DATA_DIR}/e2e-results.json`;

module.exports = {
  REPOS,
  GITHUB_API,
  DATA_DIR,
  SCRAPE_RESULTS_FILE,
  E2E_RESULTS_FILE,
};
