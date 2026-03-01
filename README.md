# operator

**Canonical control repo for the BlackRoad OS platform.**

All automation, configuration, and infrastructure definitions originate here.
No automation runs against any org or repo unless it is declared in this repo first.

## Structure

| Directory | Purpose |
|-----------|---------|
| [`config/`](config/) | Single source of truth for all configuration |
| [`docs/`](docs/) | Architecture documentation and operational runbooks |
| [`scripts/`](scripts/) | Approved automation entry-points |
| [`infra/`](infra/) | Infrastructure-as-code definitions |

## Core Rule

> All automation originates here.

- Agents do not open PRs across orgs until declared in [`config/orgs.yaml`](config/orgs.yaml).
- Every automated mutation runs through a script in [`scripts/`](scripts/).
- Every infrastructure change is declared in [`infra/`](infra/).

## Quick Start

```bash
# Validate your local environment
bash scripts/bootstrap.sh
```

## Operational Reset

If the system feels out of control, follow the reset procedure in
[`docs/runbook.md`](docs/runbook.md#operational-reset):

1. Set `global_enabled: false` in [`config/automation.yaml`](config/automation.yaml).
2. Audit [`config/orgs.yaml`](config/orgs.yaml) — disable any targets that should not be touched.
3. Re-enable targets one at a time after review.

## Docs

- [Architecture](docs/architecture.md) — system design and control-flow
- [Runbook](docs/runbook.md) — day-to-day operations