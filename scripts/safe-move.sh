#!/usr/bin/env bash
# safe-move.sh — Execute a move plan with full audit logging and dry-run support.
#
# Usage:
#   ./scripts/safe-move.sh [OPTIONS] [MOVE_PLAN_TSV] [TARGET_ROOT]
#
# Options:
#   --dry-run          Print what would happen; do NOT move anything (default)
#   --execute          Actually perform the moves
#   --archive-dupes FILE  Archive paths listed in FILE (duplicates-drop.tsv)
#                         into TARGET_ROOT/archives/duplicates/ instead of
#                         deleting them
#   --log-dir DIR      Directory for audit log (default: ./inventory-output/logs)
#
# Arguments:
#   MOVE_PLAN_TSV  Path to move-plan.tsv from categorize.sh
#                  (default: ./inventory-output/move-plan.tsv)
#   TARGET_ROOT    Root directory to move files into
#                  (default: ./blackroad-root)
#
# Outputs (always written, even in dry-run):
#   <log-dir>/audit-<timestamp>.log   — every operation with result
#
# Dependencies: cp, mv, mkdir (POSIX standard – no extra tools)

set -euo pipefail

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
DRY_RUN=true
ARCHIVE_DUPES_FILE=""
LOG_DIR=""
MOVE_PLAN_TSV="./inventory-output/move-plan.tsv"
TARGET_ROOT="./blackroad-root"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run)         DRY_RUN=true;  shift ;;
        --execute)         DRY_RUN=false; shift ;;
        --archive-dupes)   ARCHIVE_DUPES_FILE="$2"; shift 2 ;;
        --log-dir)         LOG_DIR="$2";  shift 2 ;;
        --*)
            echo "Unknown option: $1" >&2; exit 1 ;;
        *)
            # positional
            if [[ "$MOVE_PLAN_TSV" == "./inventory-output/move-plan.tsv" ]]; then
                MOVE_PLAN_TSV="$1"
            elif [[ "$TARGET_ROOT" == "./blackroad-root" ]]; then
                TARGET_ROOT="$1"
            fi
            shift ;;
    esac
done

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
# Default log dir: alongside the move plan
if [[ -z "$LOG_DIR" ]]; then
    LOG_DIR="$(dirname "$MOVE_PLAN_TSV")/logs"
fi
mkdir -p "$LOG_DIR"
AUDIT_LOG="$LOG_DIR/audit-${TIMESTAMP}.log"

log()  { echo "[safe-move] $*" >&2; }
audit(){ echo "$*" >> "$AUDIT_LOG"; }

# ---------------------------------------------------------------------------
# Sanity checks
# ---------------------------------------------------------------------------
if [[ ! -f "$MOVE_PLAN_TSV" ]]; then
    log "ERROR: move plan not found: $MOVE_PLAN_TSV"
    log "Run scripts/categorize.sh first."
    exit 1
fi

if $DRY_RUN; then
    log "=== DRY-RUN MODE – no files will be moved ==="
else
    log "=== EXECUTE MODE – files will be moved ==="
fi

log "Move plan : $MOVE_PLAN_TSV"
log "Target    : $TARGET_ROOT"
log "Audit log : $AUDIT_LOG"
log ""

audit "# safe-move audit log"
audit "# Started: $TIMESTAMP"
audit "# DryRun: $DRY_RUN"
audit "# MovePlan: $MOVE_PLAN_TSV"
audit "# TargetRoot: $TARGET_ROOT"
audit "# Columns: status | source | destination"

# ---------------------------------------------------------------------------
# Helper: perform a single safe move
# status values: OK | SKIP_MISSING | SKIP_EXISTS | ERROR | DRY
# ---------------------------------------------------------------------------
do_move() {
    local src="$1"
    local dest="$2"

    if [[ ! -e "$src" ]]; then
        audit "SKIP_MISSING	$src	$dest"
        return
    fi

    if [[ -e "$dest" ]]; then
        # Destination already exists – do NOT overwrite; flag for review
        audit "SKIP_EXISTS	$src	$dest"
        return
    fi

    if $DRY_RUN; then
        audit "DRY	$src	$dest"
        return
    fi

    local dest_dir
    dest_dir="$(dirname "$dest")"
    if ! mkdir -p "$dest_dir" 2>/dev/null; then
        audit "ERROR	$src	$dest	(mkdir failed)"
        return
    fi

    if mv -- "$src" "$dest" 2>/dev/null; then
        audit "OK	$src	$dest"
    else
        audit "ERROR	$src	$dest	(mv failed)"
    fi
}

# ---------------------------------------------------------------------------
# Process main move plan
# ---------------------------------------------------------------------------
PROCESSED=0
while IFS=$'\t' read -r source_path destination _rest; do
    [[ "$source_path" == "source_path" ]] && continue   # header
    # Prepend target root to destination (destination is relative)
    # Validate the expected 'blackroad-root/' prefix; fallback to bare dest
    if [[ "$destination" == blackroad-root/* ]]; then
        dest_abs="$TARGET_ROOT/${destination#blackroad-root/}"
    else
        dest_abs="$TARGET_ROOT/$destination"
    fi
    do_move "$source_path" "$dest_abs"
    (( PROCESSED++ )) || true
done < "$MOVE_PLAN_TSV"

log "Processed $PROCESSED entries from move plan."

# ---------------------------------------------------------------------------
# Process duplicate-drop list (archive instead of delete)
# ---------------------------------------------------------------------------
if [[ -n "$ARCHIVE_DUPES_FILE" ]]; then
    if [[ ! -f "$ARCHIVE_DUPES_FILE" ]]; then
        log "WARNING: --archive-dupes file not found: $ARCHIVE_DUPES_FILE (skipping)"
    else
        DUPE_ARCHIVE="$TARGET_ROOT/archives/duplicates"
        audit "# Archiving duplicates → $DUPE_ARCHIVE"
        DUPE_COUNT=0
        while IFS=$'\t' read -r hash drop_path; do
            [[ "$hash" == "sha256" ]] && continue   # header
            fname="$(basename "$drop_path")"
            dest_abs="$DUPE_ARCHIVE/${hash:0:8}/$fname"
            do_move "$drop_path" "$dest_abs"
            (( DUPE_COUNT++ )) || true
        done < "$ARCHIVE_DUPES_FILE"
        log "Archived $DUPE_COUNT duplicate entries."
    fi
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
if [[ -f "$AUDIT_LOG" ]]; then
    OK_COUNT=$(grep -c '^OK	' "$AUDIT_LOG" || true)
    DRY_COUNT=$(grep -c '^DRY	' "$AUDIT_LOG" || true)
    SKIP_COUNT=$(grep -c '^SKIP_' "$AUDIT_LOG" || true)
    ERR_COUNT=$(grep -c '^ERROR	' "$AUDIT_LOG" || true)

    log ""
    if $DRY_RUN; then
        log "DRY-RUN summary:"
        log "  Would move : $DRY_COUNT"
    else
        log "Execution summary:"
        log "  Moved      : $OK_COUNT"
        log "  Errors     : $ERR_COUNT"
    fi
    log "  Skipped    : $SKIP_COUNT"
    log ""
    log "Full audit log: $AUDIT_LOG"
    log ""
    if ! $DRY_RUN; then
        log "To undo these operations, run:"
        log "  ./scripts/rollback.sh $AUDIT_LOG"
    fi
fi
