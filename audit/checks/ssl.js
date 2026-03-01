/**
 * Check SSL certificate expiration for a domain.
 * Fails if the certificate expires within 14 days or is already expired.
 */

const tls = require('tls');

// Fail if the certificate expires within this many days (inclusive).
const WARN_DAYS = 14;

function checkSsl(domain) {
  return new Promise((resolve) => {
    const socket = tls.connect(
      { host: domain, port: 443, servername: domain },
      () => {
        const cert = socket.getPeerCertificate();
        socket.destroy();

        if (!cert || !cert.valid_to) {
          resolve({
            check: 'ssl',
            target: domain,
            pass: false,
            detail: 'no certificate returned',
          });
          return;
        }

        const expiresAt = new Date(cert.valid_to);
        const daysLeft = Math.floor(
          (expiresAt - Date.now()) / (1000 * 60 * 60 * 24)
        );
        const pass = daysLeft > WARN_DAYS;

        resolve({
          check: 'ssl',
          target: domain,
          pass,
          detail: `expires ${expiresAt.toISOString().split('T')[0]} (${daysLeft}d)`,
          expiresAt: expiresAt.toISOString(),
          daysLeft,
        });
      }
    );

    socket.on('error', (err) => {
      resolve({
        check: 'ssl',
        target: domain,
        pass: false,
        detail: err.message,
      });
    });

    socket.setTimeout(10000, () => {
      socket.destroy();
      resolve({
        check: 'ssl',
        target: domain,
        pass: false,
        detail: 'timeout',
      });
    });
  });
}

module.exports = { checkSsl };
