# Architecture

## Overview

`operator` is the **canonical control repo** for the BlackRoad OS platform.
All automation, configuration, and infrastructure definitions originate here.

```
┌─────────────────────────────────┐
│         operator (this repo)    │
│                                 │
│  /config  ← all config lives   │
│  /docs    ← all docs live      │
│  /scripts ← all scripts live   │
│  /infra   ← all infra lives    │
└──────────────┬──────────────────┘
               │ single source of truth
               ▼
   ┌───────────────────────┐
   │  GitHub Actions CI    │
   │  (reads config/)      │
   └───────────┬───────────┘
               │ approved automation only
               ▼
   ┌───────────────────────┐
   │  Target repos / orgs  │
   │  (declared in         │
   │   config/orgs.yaml)   │
   └───────────────────────┘
```

## AI Routing

All AI requests are routed to the local Raspberry Pi cluster (Alice, Aria,
Octavia, Lucidia) running Ollama. No external AI providers are contacted.

```
  @copilot / @lucidia / @blackboxprogramming
                │
                ▼
  ┌─────────────────────────────┐
  │   src/ai/router.js          │
  │   (handle detection +       │
  │    prompt cleaning)         │
  └──────────────┬──────────────┘
                 │
                 ▼
  ┌─────────────────────────────┐
  │   Pi Cluster (Ollama)       │
  │   alice / aria / octavia /  │
  │   lucidia (.local:11434)    │
  └─────────────────────────────┘
```

## Control-Flow Rules

1. **Config first**: A repo or org must appear in `config/orgs.yaml` with
   `enabled: true` before any automation touches it.
2. **Scripts only**: Automated mutations run exclusively through scripts in
   `scripts/`; no inline shell in workflow files.
3. **PR gate**: Every automated change opens a PR and requires at least one
   human review before merge.
4. **No distributed state**: Agents do not maintain state outside this repo.
   All state is committed here.
5. **No external AI**: All AI inference is local. External provider APIs are
   blocked at the routing layer.

## Operational Reset Procedure

If the system feels chaotic, run the reset checklist in
[runbook.md](runbook.md#operational-reset).

## Configuration Reference

| File | Purpose |
|------|---------|
| `config/automation.yaml` | Global automation kill-switch and per-target overrides |
| `config/orgs.yaml` | Registry of orgs and repos eligible for automation |
| `config/oauth.yaml` | OAuth provider and PKCE settings (GitHub or self-hosted) |
| `config/vendors.yaml` | Vendor API endpoint registry; supports self-hosted overrides |
| `config/network.yaml` | Tailscale mesh and Cloudflare tunnel settings |
