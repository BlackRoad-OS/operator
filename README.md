# operator

Centralized remote streaming engine for all BlackRoad OS organizations and repositories.

Operator connects to every GitHub organization, discovers every repository, streams live events, and broadcasts files/configs across the entire fleet — 17 orgs, 1,825+ repos, one command.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    OPERATOR CLI                      │
│  scan | stream | status | broadcast | rate-limit     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  GitHub   │  │   Stream     │  │   Remote      │  │
│  │  Client   │  │   Engine     │  │   Broadcast   │  │
│  │          │  │              │  │               │  │
│  │  - Orgs   │  │  - Polling   │  │  - Sync all   │  │
│  │  - Repos  │  │  - Events    │  │  - Push files │  │
│  │  - Events │  │  - Handlers  │  │  - Dry run    │  │
│  └──────────┘  └──────────────┘  └───────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │  Config / State / Logger / Retry / Concurrency│   │
│  └──────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
         │              │              │
         ▼              ▼              ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │  Org 1   │  │  Org 2   │  │  Org N   │
   │  repos   │  │  repos   │  │  repos   │
   └──────────┘  └──────────┘  └──────────┘
```

## Setup

```bash
# Install dependencies
npm install

# Configure
cp .env.example .env
# Edit .env with your GitHub token

# Run
npm run dev -- help
```

### Required GitHub Token Scopes

- `repo` — Full repository access
- `read:org` — Read org membership
- `admin:org` — Org administration (for full discovery)

## Commands

### `scan` — Discover everything

Crawls all organizations, lists every repository, builds a local manifest.

```bash
npm run scan
```

### `stream` — Live event stream

Streams real-time events (pushes, PRs, issues, releases) from all organizations.

```bash
npm run stream

# Custom poll interval
npm run dev -- stream --interval 10000
```

### `status [org]` — Repository status

Shows the latest commit and status for every repo across all orgs.

```bash
# All orgs
npm run dev -- status

# Specific org
npm run dev -- status --org BlackRoad-OS

# JSON output
npm run dev -- status --org BlackRoad-OS --json
```

### `broadcast` — Push to all repos

Pushes a file to every active (non-archived) repository across all organizations.

```bash
# Push LICENSE to all repos
npm run dev -- broadcast LICENSE LICENSE "legal: Deploy proprietary license v2"

# Dry run first
npm run dev -- broadcast LICENSE LICENSE "legal: Deploy license" --dry-run

# Target specific org
npm run dev -- broadcast LICENSE LICENSE "legal: Deploy license" --org BlackRoad-OS
```

### `rate-limit` — Check API budget

```bash
npm run dev -- rate-limit
```

## Configuration

All configuration via environment variables or `.env` file:

| Variable | Default | Description |
|----------|---------|-------------|
| `GITHUB_TOKEN` | — | GitHub PAT (required) |
| `OPERATOR_ORGS` | auto-discover | Comma-separated org list |
| `OPERATOR_STREAM_INTERVAL` | `30000` | Polling interval (ms) |
| `OPERATOR_STREAM_BATCH_SIZE` | `100` | Events per poll |
| `OPERATOR_CONCURRENCY` | `10` | Max parallel API calls |
| `OPERATOR_LOG_LEVEL` | `info` | debug/info/warn/error |
| `OPERATOR_DATA_DIR` | `.operator` | Local state directory |

## Programmatic Usage

```typescript
import {
  loadConfig,
  initClient,
  resolveOrgs,
  listOrgRepos,
  StreamEngine,
  createConsoleHandler,
  broadcastFile,
  reposToTargets,
} from "@blackroad/operator";

const config = loadConfig();
initClient(config.token);

// Discover everything
const orgs = await resolveOrgs(config.orgs);
for (const org of orgs) {
  const repos = await listOrgRepos(org.login);
  console.log(`${org.login}: ${repos.length} repos`);
}

// Stream events
const engine = new StreamEngine(config, state, orgs.map(o => o.login));
engine.on("stream", createConsoleHandler());
await engine.start();

// Broadcast a file to all repos
const repos = await listOrgRepos("BlackRoad-OS");
const targets = reposToTargets(repos);
await broadcastFile(targets, {
  path: "LICENSE",
  content: "...",
  commitMessage: "legal: update license",
}, 10);
```

## Project Structure

```
src/
├── cli.ts                  CLI entry point
├── config.ts               Configuration and state management
├── index.ts                Public API exports
├── github/
│   ├── client.ts           Octokit wrapper
│   ├── orgs.ts             Organization discovery
│   ├── repos.ts            Repository operations
│   └── events.ts           Event polling
├── stream/
│   ├── engine.ts           Streaming engine (EventEmitter)
│   └── handlers.ts         Event handlers (console, filter, JSON)
├── remote/
│   ├── sync.ts             Full scan and status
│   └── broadcast.ts        File broadcast to all repos
└── utils/
    ├── logger.ts           Structured logging
    ├── retry.ts            Exponential backoff retry
    └── concurrency.ts      Parallel execution pool
```

## License

Proprietary — BlackRoad OS, Inc. See [LICENSE](LICENSE).
