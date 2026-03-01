# config

This directory is the **canonical source of configuration** for all BlackRoad OS automation and infrastructure.

## Rule

> All automation originates here. No config lives elsewhere.

## Structure

```
config/
├── README.md          # This file
├── automation.yaml    # Cross-org automation settings
└── orgs.yaml          # Recognized org/repo registry
```

## Principles

- **Single source of truth**: Every pipeline, agent, and script reads config from this directory.
- **No distributed mutation**: Agents and pipelines do not modify state across orgs without a config entry here first.
- **Explicit over implicit**: All automation targets must be declared here before being activated.

## Adding a New Automation Target

1. Add an entry to `orgs.yaml` under the appropriate org.
2. Set `enabled: false` until the target has been reviewed.
3. Open a PR; once merged, flip `enabled: true` in a follow-up PR.
