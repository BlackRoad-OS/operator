# File Organization Strategy

> Scalable infrastructure for organizing large collections of mixed files
> without data loss — designed for 100k+ file repositories.

---

## 1. Canonical Directory Structure

```
blackroad-root/
├── orgs/                  ← org-scoped source code, configs, repos
│   ├── javascript/
│   ├── python/
│   ├── rust/
│   ├── go/
│   ├── shell/
│   ├── config/
│   └── misc/
├── domains/               ← web properties, HTML, CSS, domain assets
│   ├── html/
│   └── styles/
├── assets/                ← binary media (images, video, audio, fonts, design)
│   ├── images/
│   ├── video/
│   ├── audio/
│   ├── fonts/
│   └── design/
├── docs/                  ← documentation, specs, spreadsheets
│   ├── markdown/
│   ├── text/
│   ├── pdf/
│   ├── word/
│   └── spreadsheet/
├── infra/                 ← infrastructure-as-code, CI/CD, containers
│   ├── ci-cd/
│   ├── terraform/
│   ├── containers/
│   └── config/
├── archives/              ← historical builds, backups, compressed, duplicates
│   ├── build-output/
│   ├── compressed/
│   ├── backup/
│   ├── large-files/
│   └── duplicates/
└── temp/                  ← ephemeral: logs, caches, package trees, git objects
    ├── logs/
    ├── package-cache/
    └── git-objects/
```

---

## 2. Scripts Reference

| Script | Purpose |
|---|---|
| `scripts/inventory.sh` | Scan a directory tree and produce a TSV manifest with path, size, mtime, SHA-256 |
| `scripts/categorize.sh` | Read the manifest and classify every file into a canonical category + subcategory; output a move plan |
| `scripts/deduplicate.sh` | Read the manifest and identify identical files by SHA-256; produce keep/drop lists |
| `scripts/safe-move.sh` | Execute (or dry-run) the move plan with full audit logging |
| `scripts/rollback.sh` | Reverse the moves recorded in a `safe-move` audit log |

---

## 3. Step-by-Step Execution Order

### Step 0 — Prerequisites

```bash
# Verify the scripts are executable
chmod +x scripts/*.sh

# Optional: install `tree` for richer structure output
# macOS:  brew install tree
# Linux:  sudo apt install tree
```

### Step 1 — Inventory

Generate a complete manifest of the directory you want to organize.

```bash
./scripts/inventory.sh /path/to/your/files ./inventory-output
```

Outputs:
- `inventory-output/inventory.tsv` — one row per file (path, size, mtime, sha256)
- `inventory-output/structure.txt` — tree view for human review
- `inventory-output/summary.txt` — file counts and total bytes by extension

> **Review** `summary.txt` before proceeding — it gives you a bird's-eye view
> of what you are dealing with.

### Step 2 — Detect Duplicates

```bash
./scripts/deduplicate.sh ./inventory-output/inventory.tsv ./inventory-output
```

Outputs:
- `inventory-output/duplicates.tsv` — all duplicate groups
- `inventory-output/duplicates-keep.tsv` — one canonical copy per group
- `inventory-output/duplicates-drop.tsv` — redundant copies to archive

> **Review** `duplicates-keep.tsv` and override the "kept" path if the
> automatic selection (shortest path, then lexicographic) is not what you want.

### Step 3 — Categorize

```bash
./scripts/categorize.sh ./inventory-output/inventory.tsv ./inventory-output
```

Outputs:
- `inventory-output/categories.tsv` — original inventory + category columns
- `inventory-output/move-plan.tsv` — source path → canonical destination

> **Review** `move-plan.tsv` to verify the proposed destinations before
> committing to any moves.

### Step 4 — Dry Run

Always run a dry run first.  No files are moved; the audit log shows exactly
what *would* happen.

```bash
./scripts/safe-move.sh --dry-run \
    ./inventory-output/move-plan.tsv \
    ./blackroad-root
```

Review `inventory-output/logs/audit-<timestamp>.log`.

### Step 5 — Execute Moves (with duplicate archiving)

```bash
./scripts/safe-move.sh --execute \
    --archive-dupes ./inventory-output/duplicates-drop.tsv \
    ./inventory-output/move-plan.tsv \
    ./blackroad-root
```

The audit log records every `OK`, `SKIP_MISSING`, `SKIP_EXISTS`, and `ERROR`
operation so the entire run is reproducible and reversible.

### Step 6 — Rollback (if needed)

```bash
# Dry run first
./scripts/rollback.sh ./inventory-output/logs/audit-<timestamp>.log --dry-run

# Then execute
./scripts/rollback.sh ./inventory-output/logs/audit-<timestamp>.log
```

---

## 4. Categorization Rules (priority order)

1. **Noise first** — `node_modules/`, `venv/`, `.git/` internals → `temp/`
2. **Build output** — `dist/`, `build/`, `.next/` → `archives/build-output/`
3. **Logs** — `*.log`, paths containing `/logs/` → `temp/logs/`
4. **Archives** — `*.zip`, `*.tar.gz`, `*.bak` → `archives/`
5. **Infrastructure** — Dockerfile, `*.tf`, CI YAML → `infra/`
6. **Documentation** — `*.md`, `*.rst` → `docs/markdown`; `*.txt` → `docs/text`; `*.pdf` → `docs/pdf`; `*.docx` → `docs/word`
7. **Binary assets** — images, video, audio, fonts, design files → `assets/`
8. **Source code** — by language extension → `orgs/<language>/`
9. **Web** — `*.html`, `*.css` → `domains/`
10. **Large files** (>100 MB, unclassified) → `archives/large-files/`
11. **Default fallback** → `orgs/misc/`

---

## 5. Deduplication Strategy

- **Detection**: SHA-256 content hash (not file name or size alone).
- **Keep policy**: shortest directory depth; lexicographic tie-break.
  Override by editing `duplicates-keep.tsv` before executing moves.
- **Disposition**: duplicates are **archived**, not deleted.
  They land in `blackroad-root/archives/duplicates/<first-8-hash-chars>/`.
  Delete them manually after verifying the canonical copies are intact.

---

## 6. Large File Handling

Files larger than **100 MB** with no recognised type are routed to
`archives/large-files/`.  For Git compatibility:

- Add a `.gitignore` or use [Git LFS](https://git-lfs.github.com/) for files
  in `archives/` and `assets/` that exceed GitHub's 100 MB limit.
- Example `.gitignore` additions:

```gitignore
# Large binary artefacts
blackroad-root/archives/large-files/
blackroad-root/assets/video/
blackroad-root/assets/audio/

# Git LFS tracking (add to .gitattributes instead if using LFS)
*.mp4 filter=lfs diff=lfs merge=lfs -text
*.zip filter=lfs diff=lfs merge=lfs -text
```

---

## 7. Git Compatibility

- `inventory-output/` should be added to `.gitignore` — it contains generated
  TSV files that do not belong in version control.
- `blackroad-root/temp/` should also be gitignored.
- Keep `blackroad-root/` as a staging area separate from the Git working tree
  unless you intentionally want to track the organized files.

Recommended `.gitignore` additions:

```gitignore
inventory-output/
blackroad-root/temp/
blackroad-root/archives/duplicates/
```

---

## 8. Safety Guarantees

| Risk | Mitigation |
|---|---|
| Data loss during move | `mv` is atomic on same filesystem; cross-device uses copy-then-delete |
| Overwriting existing files | `SKIP_EXISTS` guard — destination is never clobbered |
| Partial run failure | Full audit log; rollback restores exact original paths in reverse order |
| Accidental deletion | Duplicates are archived, not deleted |
| Running blind | Dry-run mode is the default; `--execute` must be explicit |
