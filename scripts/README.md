# scripts

Automation scripts that are executed by CI/CD pipelines and operators.

## Rule

> Scripts in this directory are the **only** approved entry-points for automated mutation.
> No pipeline or agent may run ad-hoc commands against repos or orgs directly.

## Structure

```
scripts/
├── README.md          # This file
└── bootstrap.sh       # One-time environment bootstrap
```

## Usage

All scripts must be called from the root of this repository:

```bash
bash scripts/bootstrap.sh
```

## Adding a New Script

1. Place the script in this directory.
2. Document its purpose and expected environment variables here.
3. Open a PR for review before it is referenced by any pipeline.
