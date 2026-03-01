# operator

Infrastructure audit and status reporting for BlackRoad OS, Inc.

Correct numbers. No reliability scores. No vanity percentages. No color drama.

## Running the Audit

```bash
# Requires: jq, curl, openssl, dnsutils (nslookup/dig/host)
./infrastructure/audit.sh
```

The audit runs **nightly at 03:00 UTC** and **on demand** via GitHub Actions.

Output is written to `infrastructure/STATUS.md`.

## Metric Definitions

Every number reported has a precise, defensible definition.

### Organization Verified

GitHub API returns HTTP 200 for the organization endpoint. The org exists.

### Active Organization (30d)

At least one repository in the organization has been updated in the last 30 days.

### Domain Resolving

DNS lookup succeeds. The domain returns at least one address record.

### HTTPS 200 OK

An HTTPS GET request to the domain root returns HTTP status code 200.

### Valid SSL Certificate

The TLS certificate presented on port 443 has an expiry date in the future.

### Enterprise Reachable

The GitHub API (`api.github.com`) responds successfully.

## What This Does Not Claim

- No uptime percentage (we are not running continuous monitoring)
- No reliability score (a single audit is not a reliability measurement)
- No "production ready" designation (that requires operational criteria beyond reachability)

If something fails, the count drops. `HTTPS 200 OK: 17 / 19` means two domains did not return 200. No hiding. No coloring it green.

## Configuration

Organizations and domains are defined in [`infrastructure/config.json`](infrastructure/config.json).

## Files

```
infrastructure/
  config.json    # Source of truth: organizations and domains
  audit.sh       # Audit script
  STATUS.md      # Generated status report (do not edit manually)
.github/workflows/
  audit.yml      # Nightly + on-demand workflow
```
