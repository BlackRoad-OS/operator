#!/usr/bin/env bash
# deduplicate.sh — Detect duplicate files using SHA-256 content hashes.
#
# Usage:
#   ./scripts/deduplicate.sh [INVENTORY_TSV] [OUTPUT_DIR]
#
# Defaults:
#   INVENTORY_TSV = ./inventory-output/inventory.tsv
#   OUTPUT_DIR    = ./inventory-output
#
# Outputs:
#   duplicates.tsv       — groups of identical files (hash | file_paths...)
#   duplicates-keep.tsv  — one canonical keeper per group
#   duplicates-drop.tsv  — redundant copies safe to remove / archive
#
# The "keep" strategy: retain the path with the shortest depth, breaking ties
# by lexicographic order (earlier = kept).  You can override this by editing
# duplicates-keep.tsv before running safe-move.sh.
#
# Dependencies: awk, sort (no external tools required)

set -euo pipefail

INVENTORY_TSV="${1:-./inventory-output/inventory.tsv}"
OUTPUT_DIR="${2:-./inventory-output}"

mkdir -p "$OUTPUT_DIR"

DUPES_FILE="$OUTPUT_DIR/duplicates.tsv"
KEEP_FILE="$OUTPUT_DIR/duplicates-keep.tsv"
DROP_FILE="$OUTPUT_DIR/duplicates-drop.tsv"

log() { echo "[deduplicate] $*" >&2; }

if [[ ! -f "$INVENTORY_TSV" ]]; then
    log "ERROR: inventory file not found: $INVENTORY_TSV"
    log "Run scripts/inventory.sh first."
    exit 1
fi

log "Scanning for duplicates in: $INVENTORY_TSV"

# ---------------------------------------------------------------------------
# Step 1 – group by SHA-256; skip files with empty hash (hash column = "")
# ---------------------------------------------------------------------------
# inventory.tsv columns:  path  size_bytes  mtime_epoch  sha256  [extra...]

# Build a temp file: hash TAB path (only for non-empty hashes)
TMPFILE="$(mktemp)"
trap 'rm -f "$TMPFILE"' EXIT

awk -F'\t' 'NR > 1 && $4 != "" { print $4 "\t" $1 }' "$INVENTORY_TSV" \
    | sort > "$TMPFILE"

# ---------------------------------------------------------------------------
# Step 2 – emit duplicate groups (hashes that appear more than once)
# ---------------------------------------------------------------------------
{
    printf '%s\t%s\n' "sha256" "paths (pipe-separated)"

    awk -F'\t' '
    {
        hash = $1
        path = $2
        files[hash] = (hash in files) ? files[hash] "|" path : path
        count[hash]++
    }
    END {
        for (h in count)
            if (count[h] > 1)
                print h "\t" files[h]
    }' "$TMPFILE" | sort
} > "$DUPES_FILE"

DUPE_GROUPS=$(( $(wc -l < "$DUPES_FILE") - 1 ))
log "Found $DUPE_GROUPS duplicate groups"

if [[ "$DUPE_GROUPS" -eq 0 ]]; then
    log "No duplicates detected."
    printf '%s\t%s\n' "sha256" "kept_path" > "$KEEP_FILE"
    printf '%s\t%s\n' "sha256" "drop_path" > "$DROP_FILE"
    exit 0
fi

# ---------------------------------------------------------------------------
# Step 3 – choose which copy to keep (shortest path depth, then lex order)
# ---------------------------------------------------------------------------
{
    printf '%s\t%s\n' "sha256" "kept_path"
} > "$KEEP_FILE"

{
    printf '%s\t%s\n' "sha256" "drop_path"
} > "$DROP_FILE"

tail -n +2 "$DUPES_FILE" | while IFS=$'\t' read -r hash paths_raw; do
    IFS='|' read -ra candidates <<< "$paths_raw"

    # Score each candidate: (depth, path) then sort ascending
    best_path=""
    best_depth=99999
    for p in "${candidates[@]}"; do
        depth="${p//[^\/]}"          # keep only slashes
        depth="${#depth}"            # count them
        if [[ $depth -lt $best_depth ]] || \
           [[ $depth -eq $best_depth && "$p" < "$best_path" ]]; then
            best_depth="$depth"
            best_path="$p"
        fi
    done

    printf '%s\t%s\n' "$hash" "$best_path" >> "$KEEP_FILE"

    for p in "${candidates[@]}"; do
        [[ "$p" == "$best_path" ]] && continue
        printf '%s\t%s\n' "$hash" "$p" >> "$DROP_FILE"
    done
done

KEEP_COUNT=$(( $(wc -l < "$KEEP_FILE") - 1 ))
DROP_COUNT=$(( $(wc -l < "$DROP_FILE") - 1 ))

log "Keep: $KEEP_COUNT canonical files"
log "Drop: $DROP_COUNT redundant copies"
log ""
log "Review before acting:"
log "  duplicates : $DUPES_FILE"
log "  keep       : $KEEP_FILE"
log "  drop       : $DROP_FILE"
log ""
log "Next step: pass duplicates-drop.tsv to safe-move.sh with --archive-dupes flag."
