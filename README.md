# operator

## BLACKROAD_MASTER Containment System

A structured approach to file-system clarity before any reorganization.  
**Measure first. Move nothing until you can see everything.**

### Directory Structure

```
BLACKROAD_MASTER/
├── _raw        ← untouched original data
├── _analysis   ← generated reports
├── _sorted     ← organized output (populated later)
├── _archive    ← cold storage
└── _scripts    ← automation scripts (lives here in the repo)
```

### Quick Start

```bash
bash _scripts/blackroad_master_init.sh
```

An optional path argument overrides the default `~/BLACKROAD_MASTER` location:

```bash
bash _scripts/blackroad_master_init.sh /path/to/BLACKROAD_MASTER
```

### What the Script Does

| Phase | Description | Output |
|-------|-------------|--------|
| 1 – Freeze | Creates the five-directory scaffold | `~/BLACKROAD_MASTER/` |
| 2 – Global Scan | Lists every file under `~` and reports total count & disk usage | `_analysis/all_files.txt` |
| 3 – Largest Dirs | Finds the 30 heaviest directories (depth 2) | `_analysis/largest_dirs.txt` |
| 4 – Extension Breakdown | Counts the 30 most common file extensions | `_analysis/file_types.txt` |

After the script finishes it prints a summary showing:
- Home directory total size
- Total file count
- Top 5 extensions and top 5 largest directories

### Why This Order

> Organization without visibility = permanent damage.

The reports make the invisible structure visible.  
Only after reviewing `all_files.txt`, `largest_dirs.txt`, and `file_types.txt`  
should you begin moving or restructuring anything.
