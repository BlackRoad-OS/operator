/**
 * Check DNS resolution for a domain.
 */

const dns = require('dns');

function checkDns(domain) {
  return new Promise((resolve) => {
    dns.lookup(domain, (err, address) => {
      if (err) {
        resolve({
          check: 'dns',
          target: domain,
          pass: false,
          detail: err.message,
        });
      } else {
        resolve({
          check: 'dns',
          target: domain,
          pass: true,
          detail: address,
        });
      }
    });
  });
}

module.exports = { checkDns };
