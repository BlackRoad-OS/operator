/**
 * BlackRoad OS — AI Request Router
 *
 * Routes any request that mentions @copilot, @lucidia, or @blackboxprogramming
 * directly to a local Ollama instance.  No external AI provider is contacted.
 *
 * Environment variables (set in .env or the hosting environment):
 *   OLLAMA_BASE_URL  — Base URL of the Ollama server  (default: http://localhost:11434)
 *   OLLAMA_MODEL     — Model name to use              (default: llama3)
 */

/** Handles that are intercepted and re-routed to Ollama. */
const OLLAMA_HANDLES = ['@copilot', '@lucidia', '@blackboxprogramming'];

/**
 * Returns true when the message text contains one of the Ollama handles.
 *
 * @param {string} text
 * @returns {boolean}
 */
function isOllamaRequest(text) {
  if (typeof text !== 'string' || text.length === 0) return false;
  const lower = text.toLowerCase();
  return OLLAMA_HANDLES.some((handle) => lower.includes(handle.toLowerCase()));
}

/**
 * Strips the handle prefix from the message so Ollama receives a clean prompt.
 *
 * @param {string} text
 * @returns {string}
 */
function stripHandles(text) {
  let result = text;
  for (const handle of OLLAMA_HANDLES) {
    const re = new RegExp(handle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    result = result.replace(re, '').trim();
  }
  return result;
}

/**
 * Resolves the Ollama model name from options, then env, then a default.
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
 * Sends a prompt to the local Ollama /api/generate endpoint and returns the
 * full response text.
 *
 * @param {string} prompt           — The cleaned user prompt.
 * @param {object} [options={}]
 * @param {string} [options.baseUrl] — Override the Ollama base URL.
 * @param {string} [options.model]   — Override the model name.
 * @param {Function} [options.fetch] — Injectable fetch (useful in tests).
 * @returns {Promise<string>}
 */
async function queryOllama(prompt, options = {}) {
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
    throw new Error(`Ollama responded with HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  return data.response;
}

/**
 * Main router entry point.  Call this with any user message and it will
 * forward it to Ollama if an Ollama handle is present.
 *
 * @param {string} message          — Raw user message (may include a handle).
 * @param {object} [options={}]     — Forwarded to queryOllama.
 * @returns {Promise<{routed: boolean, response: string|null, model: string|null}>}
 */
async function route(message, options = {}) {
  if (!isOllamaRequest(message)) {
    return { routed: false, response: null, model: null };
  }

  const prompt = stripHandles(message);
  const model = resolveModel(options);

  const response = await queryOllama(prompt, options);
  return { routed: true, response, model };
}

export { OLLAMA_HANDLES, isOllamaRequest, stripHandles, queryOllama, route };
