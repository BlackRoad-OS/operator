import { createLogger } from "./logger.js";

const log = createLogger("retry");

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  opts: RetryOptions = {}
): Promise<T> {
  const { maxAttempts = 4, baseDelay = 2000, maxDelay = 16000 } = opts;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxAttempts) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        log.warn(`${label} failed (attempt ${attempt}/${maxAttempts}), retrying in ${delay}ms: ${lastError.message}`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}
