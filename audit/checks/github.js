/**
 * Check GitHub org existence via REST API.
 * Uses GITHUB_TOKEN env var when present for higher rate limits.
 */

import https from 'node:https';

export function checkGitHubOrg(org) {
  return new Promise((resolve) => {
    const headers = {
      'User-Agent': 'blackroad-audit-runner/1.0',
      'Accept': 'application/vnd.github+json',
    };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const req = https.request(
      {
        hostname: 'api.github.com',
        path: `/orgs/${encodeURIComponent(org)}`,
        method: 'GET',
        headers,
      },
      (res) => {
        const pass = res.statusCode === 200;
        resolve({
          check: 'github_org',
          target: org,
          pass,
          detail: `HTTP ${res.statusCode}`,
        });
        res.resume();
      }
    );

    req.on('error', (err) => {
      resolve({
        check: 'github_org',
        target: org,
        pass: false,
        detail: err.message,
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        check: 'github_org',
        target: org,
        pass: false,
        detail: 'timeout',
      });
    });

    req.end();
  });
}
