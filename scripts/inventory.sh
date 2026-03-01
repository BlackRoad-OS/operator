#!/usr/bin/env bash
# inventory.sh — Generate a full file inventory/manifest of a directory tree.
#
# Usage:
#   ./scripts/inventory.sh [ROOT_DIR] [OUTPUT_DIR]
#
# Defaults:
#   ROOT_DIR   = current directory (.)
#   OUTPUT_DIR = ./inventory-output
#
# Outputs:
#   inventory.tsv      — tab-separated: path, size_bytes, mtime, sha256
#   structure.txt      — tree view (excludes node_modules, .git)
#   summary.txt        — aggregate counts and sizes by extension
#
# Dependencies: find, stat, sha256sum (or shasum on macOS), sort, awk, tee

set -euo pipefail

ROOT_DIR="${1:-.}"
OUTPUT_DIR="${2:-./inventory-output}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"

mkdir -p "$OUTPUT_DIR"

INVENTORY_FILE="$OUTPUT_DIR/inventory.tsv"
STRUCTURE_FILE="$OUTPUT_DIR/structure.txt"
SUMMARY_FILE="$OUTPUT_DIR/summary.txt"

log() { echo "[inventory] $*" >&2; }

# ---------------------------------------------------------------------------
# 1. Detect sha256 utility
# ---------------------------------------------------------------------------
if command -v sha256sum &>/dev/null; then
    sha256_of() { sha256sum "$1" | awk '{print $1}'; }
elif command -v shasum &>/dev/null; then
    sha256_of() { shasum -a 256 "$1" | awk '{print $1}'; }
else
    log "WARNING: no sha256sum/shasum found – hash column will be empty"
    sha256_of() { echo ""; }
fi

# ---------------------------------------------------------------------------
# 2. Detect stat format (GNU vs BSD/macOS)
# ---------------------------------------------------------------------------
if stat --version &>/dev/null 2>&1; then
    # GNU stat
    stat_size()  { stat -c '%s' "$1"; }
    stat_mtime() { stat -c '%Y' "$1"; }
else
    # BSD/macOS stat
    stat_size()  { stat -f '%z' "$1"; }
    stat_mtime() { stat -f '%m' "$1"; }
fi

# ---------------------------------------------------------------------------
# 3. Structure tree (noise-free)
# ---------------------------------------------------------------------------
log "Generating directory structure → $STRUCTURE_FILE"
{
    echo "# Directory Structure"
    echo "# Generated: $TIMESTAMP"
    echo "# Root: $(realpath "$ROOT_DIR")"
    echo ""
    if command -v tree &>/dev/null; then
        tree -a --noreport \
            -I "node_modules|.git|__pycache__|*.pyc|*.class|.DS_Store" \
            "$ROOT_DIR"
    else
        find "$ROOT_DIR" \
            -not \( -name ".git" -prune \) \
            -not \( -name "node_modules" -prune \) \
            -not \( -name "__pycache__" -prune \) \
            | sort
    fi
} > "$STRUCTURE_FILE"

# ---------------------------------------------------------------------------
# 4. Full inventory (path, size, mtime, sha256)
# ---------------------------------------------------------------------------
log "Building inventory → $INVENTORY_FILE"
{
    printf '%s\t%s\t%s\t%s\n' "path" "size_bytes" "mtime_epoch" "sha256"
    find "$ROOT_DIR" -type f \
        -not \( -name ".git" -prune \) \
        -not \( -name "node_modules" -prune \) \
        | sort \
        | while IFS= read -r filepath; do
            size="$(stat_size "$filepath")"
            mtime="$(stat_mtime "$filepath")"
            hash="$(sha256_of "$filepath")"
            printf '%s\t%s\t%s\t%s\n' "$filepath" "$size" "$mtime" "$hash"
        done
} > "$INVENTORY_FILE"

TOTAL_FILES=$(( $(wc -l < "$INVENTORY_FILE") - 1 ))
log "Indexed $TOTAL_FILES files"

# ---------------------------------------------------------------------------
# 5. Summary by extension
# ---------------------------------------------------------------------------
log "Computing summary → $SUMMARY_FILE"
{
    echo "# Inventory Summary"
    echo "# Generated: $TIMESTAMP"
    echo "# Root: $(realpath "$ROOT_DIR")"
    echo "# Total files: $TOTAL_FILES"
    echo ""
    echo "# Files by extension (count | total_bytes | extension)"
    tail -n +2 "$INVENTORY_FILE" \
        | awk -F'\t' '{
            n = split($1, parts, ".")
            ext = (n > 1) ? parts[n] : "(no_ext)"
            count[ext]++
            bytes[ext] += $2
          }
          END {
            for (ext in count)
                printf "%d\t%d\t%s\n", count[ext], bytes[ext], ext
          }' \
        | sort -rn
} > "$SUMMARY_FILE"

log ""
log "Done. Output directory: $OUTPUT_DIR"
log "  inventory : $INVENTORY_FILE"
log "  structure : $STRUCTURE_FILE"
log "  summary   : $SUMMARY_FILE"
