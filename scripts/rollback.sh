#!/usr/bin/env bash
# rollback.sh — Reverse the operations recorded in a safe-move audit log.
#
# Usage:
#   ./scripts/rollback.sh <AUDIT_LOG> [--dry-run]
#
# Arguments:
#   AUDIT_LOG   Path to the audit-<timestamp>.log produced by safe-move.sh
#
# Options:
#   --dry-run   Show what would be reversed without making changes
#
# Behaviour:
#   • Reads every "OK" line in the audit log (format: OK TAB source TAB dest)
#   • Moves destination → source  (reverses the original move)
#   • Skips lines where destination no longer exists
#   • Skips lines where source already exists (collision guard)
#   • Writes a new rollback audit log alongside the original
#
# Dependencies: mv, mkdir (POSIX – no extra tools)

set -euo pipefail

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
AUDIT_LOG=""
DRY_RUN=false

for arg in "$@"; do
    case "$arg" in
        --dry-run) DRY_RUN=true ;;
        *)
            if [[ -z "$AUDIT_LOG" ]]; then
                AUDIT_LOG="$arg"
            else
                echo "Unexpected argument: $arg" >&2
                exit 1
            fi ;;
    esac
done

if [[ -z "$AUDIT_LOG" ]]; then
    echo "Usage: rollback.sh <AUDIT_LOG> [--dry-run]" >&2
    exit 1
fi

if [[ ! -f "$AUDIT_LOG" ]]; then
    echo "ERROR: audit log not found: $AUDIT_LOG" >&2
    exit 1
fi

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOG_DIR="$(dirname "$AUDIT_LOG")"
ROLLBACK_LOG="$LOG_DIR/rollback-${TIMESTAMP}.log"

log()  { echo "[rollback] $*" >&2; }
raudit(){ echo "$*" >> "$ROLLBACK_LOG"; }

if $DRY_RUN; then
    log "=== DRY-RUN MODE – no files will be moved ==="
else
    log "=== EXECUTE MODE – reversing moves in: $AUDIT_LOG ==="
fi

log "Rollback log: $ROLLBACK_LOG"

raudit "# rollback audit log"
raudit "# Started: $TIMESTAMP"
raudit "# DryRun: $DRY_RUN"
raudit "# SourceAudit: $AUDIT_LOG"
raudit "# Columns: status | restored_destination | original_source"

# ---------------------------------------------------------------------------
# Read OK lines in REVERSE order (last move undone first)
# ---------------------------------------------------------------------------
OK_LINES=()
while IFS= read -r line; do
    [[ "$line" == OK$'\t'* ]] && OK_LINES+=("$line")
done < "$AUDIT_LOG"

# Reverse the array
REVERSED=()
for (( i=${#OK_LINES[@]}-1; i>=0; i-- )); do
    REVERSED+=("${OK_LINES[$i]}")
done

RESTORED=0
SKIPPED=0
ERRORS=0

for line in "${REVERSED[@]}"; do
    IFS=$'\t' read -r _status original_src move_dest _rest <<< "$line"

    if [[ ! -e "$move_dest" ]]; then
        raudit "SKIP_MISSING	$move_dest	$original_src"
        (( SKIPPED++ )) || true
        continue
    fi

    if [[ -e "$original_src" ]]; then
        raudit "SKIP_EXISTS	$move_dest	$original_src"
        (( SKIPPED++ )) || true
        continue
    fi

    if $DRY_RUN; then
        raudit "DRY	$move_dest	$original_src"
        (( RESTORED++ )) || true
        continue
    fi

    src_dir="$(dirname "$original_src")"
    if ! mkdir -p "$src_dir" 2>/dev/null; then
        raudit "ERROR	$move_dest	$original_src	(mkdir failed)"
        (( ERRORS++ )) || true
        continue
    fi

    if mv -- "$move_dest" "$original_src" 2>/dev/null; then
        raudit "OK	$move_dest	$original_src"
        (( RESTORED++ )) || true
    else
        raudit "ERROR	$move_dest	$original_src	(mv failed)"
        (( ERRORS++ )) || true
    fi
done

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
log ""
if $DRY_RUN; then
    log "DRY-RUN summary:"
    log "  Would restore : $RESTORED"
else
    log "Rollback summary:"
    log "  Restored : $RESTORED"
    log "  Errors   : $ERRORS"
fi
log "  Skipped  : $SKIPPED"
log ""
log "Rollback audit log: $ROLLBACK_LOG"
