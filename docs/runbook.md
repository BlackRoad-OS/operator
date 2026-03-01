# Runbook

Day-to-day operational guide for the BlackRoad OS operator control plane.

---

## Operational Reset

Use this checklist any time the system feels out of control.

### Step 1 — Pause all cross-org automation

In `config/automation.yaml`, set:

```yaml
automation:
  global_enabled: false
```

Open a PR, merge immediately (no waiting). Automation stops within seconds of merge.

### Step 2 — Audit active targets

Review `config/orgs.yaml`. For every repo that should not currently receive
automated changes, set `enabled: false`.

### Step 3 — Identify the canonical source of truth

All configuration must live in `config/`. If you find config elsewhere:
1. Move it here.
2. Delete the old location.
3. Update any pipeline that referenced the old location to point here.

### Step 4 — Re-enable automation incrementally

For each target you are confident about:
1. Set `enabled: true` in `config/orgs.yaml`.
2. Open a PR, review, merge.
3. Observe the first automated run before enabling the next target.

---

## Adding a New Repo to Automation

1. Add an entry to `config/orgs.yaml` with `enabled: false`.
2. Open a PR describing what automation will do to this repo.
3. After review and merge, open a follow-up PR to flip `enabled: true`.

---

## Disabling a Single Target

Set `enabled: false` for the relevant entry in `config/orgs.yaml` and merge.

---

## Disabling All Automation (Emergency)

Set `global_enabled: false` in `config/automation.yaml` and merge.
