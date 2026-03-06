import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OLLAMA_HANDLES, isOllamaRequest, stripHandles, route } from '../../src/ai/router.js';

describe('AI router — Ollama routing', () => {
  describe('OLLAMA_HANDLES', () => {
    it('should contain exactly three handles', () => {
      assert.equal(OLLAMA_HANDLES.length, 3);
    });

    it('should include @copilot, @lucidia, and @blackboxprogramming', () => {
      assert.ok(OLLAMA_HANDLES.includes('@copilot'));
      assert.ok(OLLAMA_HANDLES.includes('@lucidia'));
      assert.ok(OLLAMA_HANDLES.includes('@blackboxprogramming'));
    });
  });

  describe('isOllamaRequest()', () => {
    it('returns true for a message containing @copilot', () => {
      assert.equal(isOllamaRequest('@copilot explain this'), true);
    });

    it('returns true for a message containing @lucidia', () => {
      assert.equal(isOllamaRequest('@lucidia help me'), true);
    });

    it('returns true for a message containing @blackboxprogramming', () => {
      assert.equal(isOllamaRequest('@blackboxprogramming write tests'), true);
    });

    it('is case-insensitive', () => {
      assert.equal(isOllamaRequest('@Copilot hello'), true);
      assert.equal(isOllamaRequest('@LUCIDIA hello'), true);
      assert.equal(isOllamaRequest('@BlackBoxProgramming hello'), true);
    });

    it('returns false for a message without any handle', () => {
      assert.equal(isOllamaRequest('just a plain question'), false);
    });

    it('returns false for an empty string', () => {
      assert.equal(isOllamaRequest(''), false);
    });

    it('returns false for a non-string value', () => {
      assert.equal(isOllamaRequest(null), false);
      assert.equal(isOllamaRequest(undefined), false);
      assert.equal(isOllamaRequest(42), false);
    });
  });

  describe('stripHandles()', () => {
    it('removes @copilot from a message', () => {
      assert.equal(stripHandles('@copilot explain this'), 'explain this');
    });

    it('removes @lucidia from a message', () => {
      assert.equal(stripHandles('@lucidia help me'), 'help me');
    });

    it('removes @blackboxprogramming from a message', () => {
      assert.equal(stripHandles('@blackboxprogramming write tests'), 'write tests');
    });

    it('removes multiple handles in one message', () => {
      const cleaned = stripHandles('@copilot and @lucidia do this');
      assert.ok(!cleaned.toLowerCase().includes('@copilot'));
      assert.ok(!cleaned.toLowerCase().includes('@lucidia'));
    });
  });

  describe('route()', () => {
    it('returns routed:false when no handle is present', async () => {
      const result = await route('just a plain question');
      assert.equal(result.routed, false);
      assert.equal(result.response, null);
      assert.equal(result.model, null);
    });

    it('calls the injected fetch and returns routed:true for @copilot', async () => {
      const mockFetch = async (_url, _opts) => ({
        ok: true,
        json: async () => ({ response: 'Hello from Ollama!' }),
      });

      const result = await route('@copilot explain recursion', {
        fetch: mockFetch,
        baseUrl: 'http://localhost:11434',
        model: 'llama3',
      });

      assert.equal(result.routed, true);
      assert.equal(result.response, 'Hello from Ollama!');
      assert.equal(result.model, 'llama3');
    });

    it('calls the injected fetch and returns routed:true for @lucidia', async () => {
      const mockFetch = async () => ({
        ok: true,
        json: async () => ({ response: 'Lucidia via Ollama' }),
      });

      const result = await route('@lucidia summarize this', {
        fetch: mockFetch,
        baseUrl: 'http://localhost:11434',
        model: 'llama3',
      });

      assert.equal(result.routed, true);
      assert.equal(result.response, 'Lucidia via Ollama');
    });

    it('calls the injected fetch and returns routed:true for @blackboxprogramming', async () => {
      const mockFetch = async () => ({
        ok: true,
        json: async () => ({ response: 'BlackBox via Ollama' }),
      });

      const result = await route('@blackboxprogramming review my code', {
        fetch: mockFetch,
        baseUrl: 'http://localhost:11434',
        model: 'llama3',
      });

      assert.equal(result.routed, true);
      assert.equal(result.response, 'BlackBox via Ollama');
    });

    it('propagates errors from Ollama when HTTP status is not ok', async () => {
      const mockFetch = async () => ({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      });

      await assert.rejects(
        () => route('@copilot test error', { fetch: mockFetch }),
        /Ollama responded with HTTP 500/
      );
    });
  });
});
