#!/usr/bin/env bash
# bootstrap.sh — one-time environment bootstrap for the operator control plane
#
# Usage:
#   bash scripts/bootstrap.sh
#
# Prerequisites:
#   - git
#   - A GitHub personal access token exported as GH_TOKEN (read-only scopes
#     are sufficient for validation; write scopes required for automation).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> BlackRoad OS operator bootstrap"
echo "    Repo root: ${REPO_ROOT}"

# Validate required config files exist.
required_files=(
  "config/automation.yaml"
  "config/orgs.yaml"
)

missing=0
for f in "${required_files[@]}"; do
  if [[ ! -f "${REPO_ROOT}/${f}" ]]; then
    echo "ERROR: missing required config file: ${f}" >&2
    missing=1
  fi
done

if [[ "${missing}" -eq 1 ]]; then
  echo "Bootstrap failed. Ensure all files in config/ are present." >&2
  exit 1
fi

echo "==> Config files validated."
echo "==> Bootstrap complete. All automation originates from ${REPO_ROOT}/config."
