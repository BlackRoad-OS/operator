"""
Configuration for the 5 target repos.
Each repo is a source of truth - we scrape live data, never cache stale numbers.
"""

REPOS = [
    {
        "name": "blackroad-os",
        "owner": "BlackRoad-OS",
        "full_name": "BlackRoad-OS/blackroad-os",
        "github_url": "https://github.com/BlackRoad-OS/blackroad-os",
        "description": "Enterprise AI infrastructure platform",
        "primary_language": "HTML",
    },
    {
        "name": "blackroad-os-web",
        "owner": "BlackRoad-OS",
        "full_name": "BlackRoad-OS/blackroad-os-web",
        "github_url": "https://github.com/BlackRoad-OS/blackroad-os-web",
        "description": "BlackRoad OS web presence",
        "primary_language": "TypeScript",
    },
    {
        "name": "blackroad-os-demo",
        "owner": "BlackRoad-OS",
        "full_name": "BlackRoad-OS/blackroad-os-demo",
        "github_url": "https://github.com/BlackRoad-OS/blackroad-os-demo",
        "description": "BlackRoad OS demo site",
        "primary_language": "TypeScript",
    },
    {
        "name": "lucidia-earth-website",
        "owner": "BlackRoad-OS",
        "full_name": "BlackRoad-OS/lucidia-earth-website",
        "github_url": "https://github.com/BlackRoad-OS/lucidia-earth-website",
        "description": "Lucidia.earth - the soul site",
        "primary_language": "HTML",
    },
    {
        "name": "operator",
        "owner": "BlackRoad-OS",
        "full_name": "BlackRoad-OS/operator",
        "github_url": "https://github.com/BlackRoad-OS/operator",
        "description": "BlackRoad OS operator agent",
        "primary_language": None,
    },
]

# GitHub API base (no auth required for public repo metadata)
GITHUB_API = "https://api.github.com"

# Report output
REPORT_DIR = "reports"
REPORT_FILE = "latest.json"
