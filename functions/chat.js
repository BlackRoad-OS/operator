/**
 * BlackRoad OS — /functions/chat.js
 * Cloudflare Pages Function  →  accessible at /chat
 *
 * Accepts a POST request with JSON body { "message": "<text>" }.
 * If the message contains @copilot, @lucidia, or @blackboxprogramming it is
 * forwarded to the local Ollama server.  No external AI provider is used.
 *
 * Environment variables:
 *   OLLAMA_BASE_URL       — Ollama server base URL  (default: http://localhost:11434)
 *   OLLAMA_MODEL          — Model to use            (default: llama3)
 *   OLLAMA_ALLOWED_ORIGIN — Allowed CORS origin     (default: http://localhost:11434)
 */

import { OLLAMA_HANDLES, isOllamaRequest, stripHandles } from '../src/ai/router.js';

const BASE_HEADERS = { 'Content-Type': 'application/json' };

function corsHeaders(context) {
  const allowed = context?.env?.OLLAMA_ALLOWED_ORIGIN || 'http://localhost:11434';
  return { ...BASE_HEADERS, 'Access-Control-Allow-Origin': allowed };
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(context),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function onRequestPost(context) {
  const headers = corsHeaders(context);

  let body;
  try {
    body = await context.request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Request body must be valid JSON with a "message" field.' }),
      { status: 400, headers }
    );
  }

  const message = body?.message;
  if (typeof message !== 'string' || message.trim().length === 0) {
    return new Response(
      JSON.stringify({ error: '"message" field is required and must be a non-empty string.' }),
      { status: 400, headers }
    );
  }

  if (!isOllamaRequest(message)) {
    return new Response(
      JSON.stringify({
        routed: false,
        hint: `Include one of ${OLLAMA_HANDLES.join(', ')} to route to Ollama.`,
      }),
      { status: 200, headers }
    );
  }

  const baseUrl =
    context.env?.OLLAMA_BASE_URL?.replace(/\/$/, '') || 'http://localhost:11434';
  const model = context.env?.OLLAMA_MODEL || 'llama3';
  const prompt = stripHandles(message);

  let ollamaRes;
  try {
    ollamaRes = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false }),
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Could not reach Ollama at ${baseUrl}: ${err.message}` }),
      { status: 502, headers }
    );
  }

  if (!ollamaRes.ok) {
    return new Response(
      JSON.stringify({ error: `Ollama responded with HTTP ${ollamaRes.status}` }),
      { status: 502, headers }
    );
  }

  const data = await ollamaRes.json();
  return new Response(
    JSON.stringify({ routed: true, model, response: data.response }),
    { status: 200, headers }
  );
}
