/**
 * BlackRoad OS — AI Request Router
 *
 * Routes all AI requests to the local Raspberry Pi cluster running Ollama.
 * No external AI providers (Claude, Copilot, Codex, ChatGPT, etc.) are used.
 *
 * Pi cluster nodes: Alice, Aria, Octavia, Lucidia
 *
 * Environment variables (set in .env or the hosting environment):
 *   OLLAMA_BASE_URL  — Base URL of the Ollama server on Pi  (default: http://localhost:11434)
 *   OLLAMA_MODEL     — Model name to use                    (default: llama3)
 */

/** Handles that are intercepted and routed to the local Pi cluster. */
const LOCAL_HANDLES = ['@copilot', '@lucidia', '@blackboxprogramming'];

/**
 * Returns true when the message text contains one of the local handles.
 *
 * @param {string} text
 * @returns {boolean}
 */
function isLocalRequest(text) {
  if (typeof text !== 'string' || text.length === 0) return false;
  const lower = text.toLowerCase();
  return LOCAL_HANDLES.some((handle) => lower.includes(handle.toLowerCase()));
}

/**
 * Strips the handle prefix from the message so the model receives a clean prompt.
 *
 * @param {string} text
 * @returns {string}
 */
function stripHandles(text) {
  let result = text;
  for (const handle of LOCAL_HANDLES) {
    const re = new RegExp(handle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    result = result.replace(re, '').trim();
  }
  return result;
}

/**
 * Resolves the model name from options, then env, then a default.
 *
 * @param {object} options
 * @returns {string}
 */
function resolveModel(options) {
  return (
    options.model ||
    (typeof process !== 'undefined' && process.env && process.env.OLLAMA_MODEL) ||
    'llama3'
  );
}

/**
 * Sends a prompt to the local Ollama /api/generate endpoint running on the
 * Raspberry Pi cluster and returns the full response text.
 *
 * @param {string} prompt           — The cleaned user prompt.
 * @param {object} [options={}]
 * @param {string} [options.baseUrl] — Override the Ollama base URL.
 * @param {string} [options.model]   — Override the model name.
 * @param {Function} [options.fetch] — Injectable fetch (useful in tests).
 * @returns {Promise<string>}
 */
async function queryLocal(prompt, options = {}) {
  const baseUrl =
    options.baseUrl ||
    (typeof process !== 'undefined' && process.env && process.env.OLLAMA_BASE_URL) ||
    'http://localhost:11434';

  const model = resolveModel(options);

  const fetcher = options.fetch || fetch;

  const url = `${baseUrl.replace(/\/$/, '')}/api/generate`;

  const res = await fetcher(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false }),
  });

  if (!res.ok) {
    throw new Error(`Local Ollama responded with HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  return data.response;
}

/**
 * Main router entry point.  Call this with any user message and it will
 * forward it to the local Pi cluster if a recognized handle is present.
 *
 * @param {string} message          — Raw user message (may include a handle).
 * @param {object} [options={}]     — Forwarded to queryLocal.
 * @returns {Promise<{routed: boolean, response: string|null, model: string|null}>}
 */
async function route(message, options = {}) {
  if (!isLocalRequest(message)) {
    return { routed: false, response: null, model: null };
  }

  const prompt = stripHandles(message);
  const model = resolveModel(options);

  const response = await queryLocal(prompt, options);
  return { routed: true, response, model };
}

export { LOCAL_HANDLES, isLocalRequest, stripHandles, queryLocal, route };
