/**
 * Check HTTPS reachability (status code 200–399 counts as pass).
 */

import https from 'node:https';

export function checkHttps(domain) {
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: domain,
        path: '/',
        method: 'GET',
        headers: { 'User-Agent': 'blackroad-audit-runner/1.0' },
      },
      (res) => {
        const pass = res.statusCode >= 200 && res.statusCode < 400;
        resolve({
          check: 'https',
          target: domain,
          pass,
          detail: `HTTP ${res.statusCode}`,
        });
        res.resume();
      }
    );

    req.on('error', (err) => {
      resolve({
        check: 'https',
        target: domain,
        pass: false,
        detail: err.message,
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        check: 'https',
        target: domain,
        pass: false,
        detail: 'timeout',
      });
    });

    req.end();
  });
}
