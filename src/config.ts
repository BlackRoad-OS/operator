import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

export interface OperatorConfig {
  token: string;
  orgs: string[];
  stream: {
    interval: number;
    batchSize: number;
  };
  concurrency: number;
  logLevel: "debug" | "info" | "warn" | "error";
  dataDir: string;
}

const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;

function parseLogLevel(val: string | undefined): OperatorConfig["logLevel"] {
  if (val && LOG_LEVELS.includes(val as any)) return val as OperatorConfig["logLevel"];
  return "info";
}

export function loadConfig(): OperatorConfig {
  // Load .env if present
  const envPath = resolve(".env");
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      "GITHUB_TOKEN is required. Set it in .env or as an environment variable.\n" +
      "Required scopes: repo, read:org, admin:org"
    );
  }

  const orgsRaw = process.env.OPERATOR_ORGS || "";
  const orgs = orgsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const dataDir = resolve(process.env.OPERATOR_DATA_DIR || ".operator");
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

  return {
    token,
    orgs,
    stream: {
      interval: parseInt(process.env.OPERATOR_STREAM_INTERVAL || "30000", 10),
      batchSize: parseInt(process.env.OPERATOR_STREAM_BATCH_SIZE || "100", 10),
    },
    concurrency: parseInt(process.env.OPERATOR_CONCURRENCY || "10", 10),
    logLevel: parseLogLevel(process.env.OPERATOR_LOG_LEVEL),
    dataDir,
  };
}

export interface OperatorState {
  lastScan: string | null;
  orgs: Record<string, { repoCount: number; lastSync: string }>;
  streamCursor: Record<string, string>;
}

export function loadState(dataDir: string): OperatorState {
  const statePath = join(dataDir, "state.json");
  if (existsSync(statePath)) {
    return JSON.parse(readFileSync(statePath, "utf-8"));
  }
  return { lastScan: null, orgs: {}, streamCursor: {} };
}

export function saveState(dataDir: string, state: OperatorState): void {
  const statePath = join(dataDir, "state.json");
  writeFileSync(statePath, JSON.stringify(state, null, 2));
}
