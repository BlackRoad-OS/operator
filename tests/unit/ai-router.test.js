import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LOCAL_HANDLES, isLocalRequest, stripHandles, route } from '../../src/ai/router.js';

describe('AI router — local Pi cluster routing', () => {
  describe('LOCAL_HANDLES', () => {
    it('should contain exactly three handles', () => {
      assert.equal(LOCAL_HANDLES.length, 3);
    });

    it('should include @copilot, @lucidia, and @blackboxprogramming', () => {
      assert.ok(LOCAL_HANDLES.includes('@copilot'));
      assert.ok(LOCAL_HANDLES.includes('@lucidia'));
      assert.ok(LOCAL_HANDLES.includes('@blackboxprogramming'));
    });
  });

  describe('isLocalRequest()', () => {
    it('returns true for a message containing @copilot', () => {
      assert.equal(isLocalRequest('@copilot explain this'), true);
    });

    it('returns true for a message containing @lucidia', () => {
      assert.equal(isLocalRequest('@lucidia help me'), true);
    });

    it('returns true for a message containing @blackboxprogramming', () => {
      assert.equal(isLocalRequest('@blackboxprogramming write tests'), true);
    });

    it('is case-insensitive', () => {
      assert.equal(isLocalRequest('@Copilot hello'), true);
      assert.equal(isLocalRequest('@LUCIDIA hello'), true);
      assert.equal(isLocalRequest('@BlackBoxProgramming hello'), true);
    });

    it('returns false for a message without any handle', () => {
      assert.equal(isLocalRequest('just a plain question'), false);
    });

    it('returns false for an empty string', () => {
      assert.equal(isLocalRequest(''), false);
    });

    it('returns false for a non-string value', () => {
      assert.equal(isLocalRequest(null), false);
      assert.equal(isLocalRequest(undefined), false);
      assert.equal(isLocalRequest(42), false);
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

    it('routes @copilot to local Pi cluster', async () => {
      const mockFetch = async (_url, _opts) => ({
        ok: true,
        json: async () => ({ response: 'Hello from Pi cluster!' }),
      });

      const result = await route('@copilot explain recursion', {
        fetch: mockFetch,
        baseUrl: 'http://localhost:11434',
        model: 'llama3',
      });

      assert.equal(result.routed, true);
      assert.equal(result.response, 'Hello from Pi cluster!');
      assert.equal(result.model, 'llama3');
    });

    it('routes @lucidia to local Pi cluster', async () => {
      const mockFetch = async () => ({
        ok: true,
        json: async () => ({ response: 'Lucidia via Pi cluster' }),
      });

      const result = await route('@lucidia summarize this', {
        fetch: mockFetch,
        baseUrl: 'http://localhost:11434',
        model: 'llama3',
      });

      assert.equal(result.routed, true);
      assert.equal(result.response, 'Lucidia via Pi cluster');
    });

    it('routes @blackboxprogramming to local Pi cluster', async () => {
      const mockFetch = async () => ({
        ok: true,
        json: async () => ({ response: 'BlackBox via Pi cluster' }),
      });

      const result = await route('@blackboxprogramming review my code', {
        fetch: mockFetch,
        baseUrl: 'http://localhost:11434',
        model: 'llama3',
      });

      assert.equal(result.routed, true);
      assert.equal(result.response, 'BlackBox via Pi cluster');
    });

    it('propagates errors when Pi cluster is unreachable', async () => {
      const mockFetch = async () => ({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      });

      await assert.rejects(
        () => route('@copilot test error', { fetch: mockFetch }),
        /Local Ollama responded with HTTP 500/
      );
    });
  });
});
