#!/usr/bin/env bash
# blackroad_master_init.sh
# BLACKROAD_MASTER Containment & Analysis System
#
# Phases:
#   1 – Freeze the Chaos   : create directory scaffold under ~/BLACKROAD_MASTER
#   2 – Global Scan        : enumerate every file under ~
#   3 – Largest Directories: find where disk weight lives
#   4 – Extension Breakdown: identify what file types dominate
#
# Usage:  bash blackroad_master_init.sh [TARGET_DIR]
#   TARGET_DIR defaults to ~/BLACKROAD_MASTER

set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────────────
TARGET="${1:-$HOME/BLACKROAD_MASTER}"
ANALYSIS="$TARGET/_analysis"

# ── Phase 1: Freeze The Chaos ─────────────────────────────────────────────────
echo "==> Phase 1: Creating BLACKROAD_MASTER scaffold at $TARGET"
mkdir -p \
  "$TARGET/_raw" \
  "$TARGET/_analysis" \
  "$TARGET/_sorted" \
  "$TARGET/_archive" \
  "$TARGET/_scripts"

echo "    Scaffold created:"
echo "    $TARGET"
echo "    ├── _raw       (untouched original data)"
echo "    ├── _analysis  (reports)"
echo "    ├── _sorted    (organized output)"
echo "    ├── _archive   (cold storage)"
echo "    └── _scripts   (automation)"

# ── Phase 2: Global Scan ──────────────────────────────────────────────────────
echo ""
echo "==> Phase 2: Global file scan of ~"
ALL_FILES="$ANALYSIS/all_files.txt"
find ~ -type f 2>/dev/null > "$ALL_FILES"
FILE_COUNT=$(wc -l < "$ALL_FILES")
echo "    Total files found: $FILE_COUNT"
echo "    Report: $ALL_FILES"

DISK_USAGE=$(du -sh ~ 2>/dev/null | cut -f1)
echo "    Home directory size: $DISK_USAGE"

# ── Phase 3: Largest Directories ─────────────────────────────────────────────
echo ""
echo "==> Phase 3: Identifying largest directories (depth 2)"
LARGEST_DIRS="$ANALYSIS/largest_dirs.txt"
du -h -d 2 ~ 2>/dev/null | sort -hr | head -n 30 > "$LARGEST_DIRS"
echo "    Top 5 largest directories:"
head -n 5 "$LARGEST_DIRS" | awk '{printf "      %-8s %s\n", $1, $2}'
echo "    Full report: $LARGEST_DIRS"

# ── Phase 4: Extension Breakdown ─────────────────────────────────────────────
# Note: "-name '*.*'" intentionally limits results to files that have an
# extension; extensionless files (Makefile, Dockerfile, …) are excluded by
# design so the count reflects named extension types only.
# For files with multiple dots (e.g. archive.tar.gz) only the final extension
# (gz) is reported, which is the standard convention for this analysis.
echo ""
echo "==> Phase 4: Extension breakdown"
FILE_TYPES="$ANALYSIS/file_types.txt"
find ~ -type f -name "*.*" 2>/dev/null \
  | sed 's/.*\.//' \
  | tr '[:upper:]' '[:lower:]' \
  | sort \
  | uniq -c \
  | sort -nr \
  | head -n 30 > "$FILE_TYPES"
echo "    Top 5 file extensions:"
head -n 5 "$FILE_TYPES" | awk '{printf "      %6s  .%s\n", $1, $2}'
echo "    Full report: $FILE_TYPES"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════"
echo " BLACKROAD_MASTER — Containment Complete"
echo "════════════════════════════════════════════════"
echo " Home size   : $DISK_USAGE"
echo " Total files : $FILE_COUNT"
echo ""
echo " Reports written to $ANALYSIS :"
echo "   all_files.txt   — full file inventory"
echo "   largest_dirs.txt — top 30 directories by size"
echo "   file_types.txt  — top 30 extensions by count"
echo ""
echo " Next step: review the reports, then move to"
echo "            intelligent restructuring."
echo "════════════════════════════════════════════════"
