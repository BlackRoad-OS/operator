# operator

**BlackRoad OS Control Plane — Trust Architecture**

Config-driven infrastructure verification for BlackRoad OS, Inc.

## What This Is

A single system that serves three audiences at three zoom levels:

| Layer | Audience | Question It Answers |
|-------|----------|-------------------|
| Public Credibility | Customers | "Does this actually run?" |
| Internal Governance | Operators | "Is everything still healthy?" |
| Investor Signal | Investors / Auditors | "Can this operate without chaos?" |

## Structure

```
operator/
├── config/
│   └── blackroad.json       # Infrastructure map — all 17 orgs, checks, thresholds
├── audit/
│   ├── run.js                # Automated verification script
│   └── output.json           # Generated audit results (gitignored until first run)
├── public/
│   ├── index.html            # Public infrastructure directory
│   └── status.html           # Live status page — reads from audit/output.json
└── .github/
    └── workflows/
        └── audit.yml         # CI pipeline — runs daily + on push
```

## How It Works

1. `config/blackroad.json` defines every org, what checks to run, and pass/fail thresholds
2. `audit/run.js` reads the config, hits the GitHub API, and writes structured results to `audit/output.json`
3. `public/status.html` renders the audit output — no manual narrative, just state
4. `.github/workflows/audit.yml` triggers the audit on push, on schedule, and on demand

Every push triggers verification. Failures break the build. Logs timestamp everything.

## Running Locally

```sh
# Run the audit
node audit/run.js --verbose

# With higher API rate limits
GITHUB_TOKEN=ghp_... node audit/run.js --verbose
```

## Verification Checks

| Check | Severity | Description |
|-------|----------|-------------|
| `org_exists` | critical | GitHub organization exists and is accessible |
| `has_repos` | warning | Organization has at least one repository |
| `recent_activity` | info | At least one commit within the last 90 days |
| `has_readme` | warning | Organization or primary repo has a README |
| `ssl_valid` | critical | Associated domain has valid SSL |

## Principles

- **Deterministic**: Same input produces same output
- **Independent**: Script runs without human intervention
- **Verifiable**: Anyone can clone, run, and verify
- **Continuous**: Not a one-time audit — runs on schedule

## License

Proprietary — BlackRoad OS, Inc. See [LICENSE](LICENSE).
