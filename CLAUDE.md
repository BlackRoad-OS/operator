# CLAUDE.md — AI Assistant Guide for `operator`

## Project Overview

**operator** is a proprietary project under [BlackRoad OS, Inc.](https://blackroad.io), a Delaware C-Corporation founded by Alexa Louise Amundson. All AI inference is handled locally on the Raspberry Pi cluster (Alice, Aria, Octavia, Lucidia) running Ollama. No external AI providers are used.

## Repository Structure

```
operator/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md          # Bug report template
│   │   └── feature_request.md     # Feature request template
│   ├── PULL_REQUEST_TEMPLATE.md   # PR template with checklist
│   └── workflows/                 # GitHub Actions (audit, tests, e2e)
├── config/
│   ├── blackroad.json             # Core config (orgs, domains, AI routing)
│   ├── oauth.yaml                 # OAuth provider config
│   ├── network.yaml               # Tailscale, Cloudflare, Pi cluster
│   └── vendors.yaml               # External API vendor endpoints
├── src/
│   ├── ai/router.js               # Routes @handles to local Pi cluster
│   └── ...                        # Application source
├── functions/chat.js              # Cloudflare Pages chat endpoint
├── audit/                         # Infrastructure audit runner
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── CURRENT_STATE.md
├── LICENSE                        # BlackRoad OS proprietary license
├── README.md
└── CLAUDE.md                      # This file
```

## Licensing

This is **proprietary software** — NOT open source. The LICENSE file is a comprehensive proprietary license from BlackRoad OS, Inc. Do not add open-source license headers, SPDX identifiers, or any licensing that conflicts with the existing proprietary license.

## BlackRoad OS Core Principles

All contributions must align with these principles:

1. **Sovereignty** — Users own their data and infrastructure
2. **Privacy** — No telemetry, tracking, or external analytics
3. **Offline-First** — Core features must work without internet
4. **Design Excellence** — Follow the BlackRoad design system
5. **Production Quality** — Code must be reliable and scalable

### Strictly Prohibited

- External AI providers (no Claude API, no OpenAI API, no Copilot cloud, no Codex)
- External analytics or telemetry of any kind
- Required internet connectivity for core features
- Vendor lock-in mechanisms
- Cloud-only functionality
- Anything that compromises user privacy

### AI Routing Policy

All AI handles (`@copilot`, `@lucidia`, `@blackboxprogramming`) are intercepted and routed to the local Raspberry Pi cluster running Ollama. See `src/ai/router.js` for implementation and `config/blackroad.json` for configuration.

## Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
```
feat(api): Add new authentication endpoint
fix(ui): Resolve button alignment issue
docs(readme): Update installation instructions
```

## Branch Naming

Use the pattern: `feature/description` (e.g., `feature/amazing-feature`).

## Pull Request Process

PRs must follow the template in `.github/PULL_REQUEST_TEMPLATE.md`:
- Describe the change and link related issues
- Select change type (bug fix, feature, breaking change, docs, style, refactor)
- Confirm testing: existing tests pass, new tests added, manual testing done
- Verify BlackRoad OS alignment: sovereignty, privacy, offline capability, no unnecessary external dependencies, follows design system

## Issue Templates

- **Bug reports** (`.github/ISSUE_TEMPLATE/bug_report.md`): Include reproduction steps, expected vs actual behavior, environment details
- **Feature requests** (`.github/ISSUE_TEMPLATE/feature_request.md`): Include problem description, proposed solution, BlackRoad OS alignment checklist

## Development Guidelines

### Code Standards

- Follow language-specific best practices
- Write self-documenting code
- Add comments only for complex logic
- Keep functions small and focused
- Use meaningful variable names

### When Adding New Code

- Ensure any dependencies respect the offline-first and privacy principles
- Avoid dependencies that phone home, collect telemetry, or require cloud services
- Never add integrations with external AI providers — all AI runs on the local Pi cluster
- Prefer vendored or self-hosted dependencies where possible

## Contact

- **GitHub Issues**: For bug reports and feature requests
- **Email**: blackroad.systems@gmail.com
- **Website**: [blackroad.io](https://blackroad.io)
