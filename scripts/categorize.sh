#!/usr/bin/env bash
# categorize.sh — Classify files from an inventory.tsv into canonical categories.
#
# Usage:
#   ./scripts/categorize.sh [INVENTORY_TSV] [OUTPUT_DIR]
#
# Defaults:
#   INVENTORY_TSV = ./inventory-output/inventory.tsv
#   OUTPUT_DIR    = ./inventory-output
#
# Outputs:
#   categories.tsv  — original columns + category + subcategory columns
#   move-plan.tsv   — source_path → suggested_destination (relative to blackroad-root)
#
# Canonical top-level structure (mirrors /blackroad-root in docs):
#   orgs/       — org-scoped source code & config repos
#   domains/    — domain / web-property assets
#   assets/     — images, sprites, icons, fonts, media
#   docs/       — documentation, specs, notes
#   infra/      — infrastructure-as-code, CI/CD, containers
#   archives/   — old builds, backups, historical zips
#   temp/       — log files, ephemeral outputs, cache

set -euo pipefail

INVENTORY_TSV="${1:-./inventory-output/inventory.tsv}"
OUTPUT_DIR="${2:-./inventory-output}"

mkdir -p "$OUTPUT_DIR"

CATEGORIES_FILE="$OUTPUT_DIR/categories.tsv"
MOVE_PLAN_FILE="$OUTPUT_DIR/move-plan.tsv"

log() { echo "[categorize] $*" >&2; }

# ---------------------------------------------------------------------------
# classify_file PATH SIZE → prints "category\tsubcategory"
# Rules applied in priority order (first match wins).
# ---------------------------------------------------------------------------
classify_file() {
    local path="$1"
    local size="$2"
    local lower
    lower="$(echo "$path" | tr '[:upper:]' '[:lower:]')"
    local base
    base="$(basename "$lower")"
    local ext="${base##*.}"
    [[ "$ext" == "$base" ]] && ext=""   # no extension

    # ── Node modules / Python venv (noise)
    if [[ "$lower" == *"/node_modules/"* ]] || \
       [[ "$lower" == *"/venv/"* ]] || \
       [[ "$lower" == *"/.venv/"* ]] || \
       [[ "$lower" == *"/site-packages/"* ]]; then
        echo "temp	package-cache"; return
    fi

    # ── .git internals
    if [[ "$lower" == *"/.git/"* ]]; then
        echo "temp	git-objects"; return
    fi

    # ── Build artefacts / dist
    if [[ "$lower" == *"/dist/"* ]] || \
       [[ "$lower" == *"/build/"* ]] || \
       [[ "$lower" == *"/.next/"* ]] || \
       [[ "$lower" == *"/.nuxt/"* ]] || \
       [[ "$lower" == *"/out/"* && "$ext" == "js" ]]; then
        echo "archives	build-output"; return
    fi

    # ── Logs
    if [[ "$ext" == "log" ]] || \
       [[ "$base" == *".log."* ]] || \
       [[ "$lower" == *"/logs/"* ]]; then
        echo "temp	logs"; return
    fi

    # ── Archives / backups
    case "$ext" in
        zip|tar|gz|bz2|xz|7z|rar|tgz)
            echo "archives	compressed"; return ;;
        bak|backup|old)
            echo "archives	backup"; return ;;
    esac

    # ── Infrastructure / DevOps
    case "$base" in
        dockerfile|docker-compose.yml|docker-compose.yaml|\
        ".dockerignore"|terraform.tf|main.tf|variables.tf|outputs.tf)
            echo "infra	containers"; return ;;
    esac
    case "$ext" in
        tf|tfvars)  echo "infra	terraform"; return ;;
        yaml|yml)
            if [[ "$lower" == *"/.github/"* ]] || \
               [[ "$base" == *"ci"* ]] || \
               [[ "$base" == *"deploy"* ]] || \
               [[ "$base" == *"pipeline"* ]]; then
                echo "infra	ci-cd"; return
            fi
            echo "infra	config"; return ;;
        toml)
            if [[ "$lower" == *"/cargo"* ]]; then
                echo "orgs	rust-config"; return
            fi
            echo "infra	config"; return ;;
    esac

    # ── Documentation
    case "$ext" in
        md|mdx|rst|adoc|asciidoc)
            echo "docs	markdown"; return ;;
        txt)
            echo "docs	text"; return ;;
        pdf)
            echo "docs	pdf"; return ;;
        docx|doc|odt|pages)
            echo "docs	word"; return ;;
        xlsx|xls|csv|ods)
            echo "docs	spreadsheet"; return ;;
    esac

    # ── Assets — images / media / fonts
    case "$ext" in
        png|jpg|jpeg|gif|svg|ico|webp|avif|bmp|tiff)
            echo "assets	images"; return ;;
        mp4|mov|avi|mkv|webm|ogv)
            echo "assets	video"; return ;;
        mp3|wav|ogg|flac|aac)
            echo "assets	audio"; return ;;
        woff|woff2|ttf|otf|eot)
            echo "assets	fonts"; return ;;
        sketch|fig|psd|ai|xd)
            echo "assets	design"; return ;;
    esac

    # ── Source code → orgs
    case "$ext" in
        js|mjs|cjs|ts|tsx|jsx)  echo "orgs	javascript"; return ;;
        py)                      echo "orgs	python";     return ;;
        rs)                      echo "orgs	rust";       return ;;
        go)                      echo "orgs	go";         return ;;
        java|kt|kts)             echo "orgs	jvm";        return ;;
        rb)                      echo "orgs	ruby";       return ;;
        php)                     echo "orgs	php";        return ;;
        cs)                      echo "orgs	csharp";     return ;;
        cpp|cc|cxx|h|hpp)        echo "orgs	cpp";        return ;;
        c)                       echo "orgs	c";          return ;;
        sh|bash|zsh|fish)        echo "orgs	shell";      return ;;
        html|htm)                echo "domains	html";   return ;;
        css|scss|sass|less)      echo "domains	styles"; return ;;
        json|jsonc)              echo "orgs	config";     return ;;
        sql)                     echo "orgs	database";   return ;;
        graphql|gql)             echo "orgs	graphql";    return ;;
    esac

    # ── Large files without recognised type → archives
    if [[ "$size" -gt 104857600 ]]; then   # > 100 MB
        echo "archives	large-files"; return
    fi

    # ── Default
    echo "orgs	misc"
}

# ---------------------------------------------------------------------------
# Build canonical destination path from category + original path
# ---------------------------------------------------------------------------
canonical_dest() {
    local category="$1"
    local subcategory="$2"
    local src_path="$3"
    local filename
    filename="$(basename "$src_path")"

    # Strip leading ./ or /
    local relative="${src_path#./}"
    relative="${relative#/}"

    # Use first two path segments after root as org/domain hint if present
    local hint=""
    local seg1 seg2
    seg1="$(echo "$relative" | cut -d'/' -f1)"
    seg2="$(echo "$relative" | cut -d'/' -f2)"
    [[ "$seg1" != "$filename" ]] && hint="$seg1"
    [[ -n "$hint" && "$seg2" != "$filename" ]] && hint="$seg1/$seg2"

    if [[ -n "$hint" ]]; then
        echo "blackroad-root/$category/$subcategory/$hint/$filename"
    else
        echo "blackroad-root/$category/$subcategory/$filename"
    fi
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
log "Reading inventory: $INVENTORY_TSV"

if [[ ! -f "$INVENTORY_TSV" ]]; then
    log "ERROR: inventory file not found: $INVENTORY_TSV"
    log "Run scripts/inventory.sh first."
    exit 1
fi

log "Writing categories → $CATEGORIES_FILE"
log "Writing move plan  → $MOVE_PLAN_FILE"

{
    printf '%s\t%s\t%s\t%s\t%s\t%s\n' \
        "path" "size_bytes" "mtime_epoch" "sha256" "category" "subcategory"
} > "$CATEGORIES_FILE"

{
    printf '%s\t%s\t%s\t%s\n' \
        "source_path" "destination" "category" "subcategory"
} > "$MOVE_PLAN_FILE"

TOTAL=0
while IFS=$'\t' read -r path size mtime hash; do
    [[ "$path" == "path" ]] && continue   # skip header
    result="$(classify_file "$path" "$size")"
    category="${result%%$'\t'*}"
    subcategory="${result##*$'\t'}"
    dest="$(canonical_dest "$category" "$subcategory" "$path")"
    printf '%s\t%s\t%s\t%s\t%s\t%s\n' \
        "$path" "$size" "$mtime" "$hash" "$category" "$subcategory" \
        >> "$CATEGORIES_FILE"
    printf '%s\t%s\t%s\t%s\n' \
        "$path" "$dest" "$category" "$subcategory" \
        >> "$MOVE_PLAN_FILE"
    (( TOTAL++ )) || true
done < "$INVENTORY_TSV"

log "Categorized $TOTAL files."
log "  categories : $CATEGORIES_FILE"
log "  move plan  : $MOVE_PLAN_FILE"
