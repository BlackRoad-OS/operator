# BlackRoad OS — Control Plane

Config-driven infrastructure dashboard. Edit one JSON file, everything updates.

## Architecture

```
operator/
├── config/
│   └── blackroad.json        # Single source of truth
├── public/
│   ├── index.html             # Directory — org listing w/ filters
│   ├── status.html            # Status — org + domain health
│   ├── map.html               # Map — org tree + domain topology
│   ├── css/
│   │   └── style.css          # Brutalist design system
│   └── js/
│       └── render.js          # Config-driven renderer
├── functions/
│   └── api.js                 # Cloudflare Pages Function (GitHub proxy)
├── .env.example
└── README.md
```

## How It Works

1. All orgs, domains, roles defined in `config/blackroad.json`
2. `render.js` loads config at runtime, renders all pages
3. Counts auto-calculate from config data
4. Add an org → add one object to the JSON → done
5. `functions/api.js` proxies GitHub API for live repo data

## Pages

| Page | Path | Purpose |
|------|------|---------|
| Directory | `/` | Filterable org grid with role badges |
| Status | `/status.html` | Org + domain status tables |
| Map | `/map.html` | Org-by-role tree + domain-by-TLD map |

## Config Schema

```json
{
  "meta": { "name", "enterprise", "tagline", "version", "updated" },
  "orgs": [{ "id", "name", "role", "description", "url", "status" }],
  "domains": [{ "domain", "purpose", "status" }],
  "roles": { "key": { "label", "description" } }
}
```

## Deploy to Cloudflare Pages

```bash
# 1. Connect repo to Cloudflare Pages
#    Build output directory: public
#    No build command needed

# 2. Set environment variable
#    GITHUB_TOKEN = your GitHub PAT with read:org scope

# 3. Push to main
git push origin main
```

Cloudflare Pages auto-detects the `/functions` directory and deploys edge functions.

## Local Dev

```bash
# Serve locally (any static server works)
npx wrangler pages dev public

# Or simply
cd public && python3 -m http.server 8000
```

## Adding an Org

Edit `config/blackroad.json`:

```json
{
  "id": "new-org",
  "name": "New Org",
  "role": "engineering",
  "description": "What this org does.",
  "url": "https://github.com/new-org",
  "status": "active"
}
```

Push. Done. All pages update automatically.

## Expansion Path

- **Live repo counts** — Wire `functions/api.js` into render.js to show repo counts per org
- **Health checks** — Add domain ping endpoint, render real uptime in status page
- **Multi-tenant** — Multiple config files, one per tenant, switcher in nav
- **Web Components** — Extract cards/tables into `<br-card>`, `<br-table>` custom elements
- **CI/CD status** — Pull GitHub Actions status per repo into status page
- **Auth layer** — Cloudflare Access for internal-only pages
