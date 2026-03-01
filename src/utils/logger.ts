const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type Level = keyof typeof LEVELS;

let currentLevel: Level = "info";

export function setLogLevel(level: Level): void {
  currentLevel = level;
}

function fmt(level: string, scope: string, msg: string): string {
  const ts = new Date().toISOString();
  return `${ts} [${level.toUpperCase().padEnd(5)}] [${scope}] ${msg}`;
}

export function createLogger(scope: string) {
  return {
    debug: (msg: string, ...args: unknown[]) => {
      if (LEVELS[currentLevel] <= LEVELS.debug)
        console.debug(fmt("debug", scope, msg), ...args);
    },
    info: (msg: string, ...args: unknown[]) => {
      if (LEVELS[currentLevel] <= LEVELS.info)
        console.log(fmt("info", scope, msg), ...args);
    },
    warn: (msg: string, ...args: unknown[]) => {
      if (LEVELS[currentLevel] <= LEVELS.warn)
        console.warn(fmt("warn", scope, msg), ...args);
    },
    error: (msg: string, ...args: unknown[]) => {
      if (LEVELS[currentLevel] <= LEVELS.error)
        console.error(fmt("error", scope, msg), ...args);
    },
  };
}
