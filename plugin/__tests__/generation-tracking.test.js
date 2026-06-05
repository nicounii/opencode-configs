import { describe, it, expect, beforeEach } from 'bun:test';
import { ACTIVE, handleMessageUpdated } from '../langfuse.js';

describe('LLM generation tracking', () => {
  let mockLf;

  beforeEach(() => {
    ACTIVE.clear();
    mockLf = {
      _generations: [],
      _updates: [],
      generation(args) {
        const gen = {
          ...args,
          update(upd) { mockLf._updates.push(upd); },
          get metadata() { return args.metadata || {}; },
        };
        this._generations.push(args);
        return gen;
      },
      get generations() { return this._generations; },
      get updates() { return this._updates; },
    };
  });

  function activeSession(sessionId = 'ses_1') {
    ACTIVE.set(sessionId, {
      traceId: 'trace_1',
      generations: new Map(),
      spans: new Map(),
      fileChanges: [],
      createdAt: Date.now() / 1000,
    });
    return sessionId;
  }

  function helperEvent(id, overrides = {}) {
    return {
      properties: {
        info: {
          id,
          role: 'assistant',
          sessionID: 'ses_1',
          modelID: 'gpt-4',
          providerID: 'openai',
          mode: 'chat',
          tokens: { input: 10, output: 20 },
          cost: 0.05,
          time: { created: Date.now() - 1000, completed: Date.now() },
          ...overrides,
        },
      },
    };
  }

  it('ignores user messages', () => {
    activeSession();
    const event = helperEvent('msg_1', { role: 'user' });
    handleMessageUpdated(event, mockLf);
    expect(ACTIVE.get('ses_1').generations.size).toBe(0);
  });

  it('creates generation for completed assistant messages', () => {
    activeSession();
    const event = helperEvent('msg_1');
    handleMessageUpdated(event, mockLf);

    const state = ACTIVE.get('ses_1');
    expect(state.generations.size).toBe(1);
    expect(state.generations.has('msg_1')).toBe(true);

    // Verify it was called with correct args
    expect(mockLf.generations).toHaveLength(1);
    const args = mockLf.generations[0];
    expect(args.id).toBe('msg_1');
    expect(args.model).toBe('gpt-4');
    expect(args.modelParameters.provider).toBe('openai');
    expect(args.modelParameters.mode).toBe('chat');
    expect(args.usage.input).toBe(10);
    expect(args.usage.output).toBe(20);
    expect(args.usage.total).toBe(30);
    expect(args.cost).toBe(0.05);
    expect(args.tags).toContain('opencode');
    expect(args.tags).toContain('llm');
  });

  it('skips incomplete messages (no time.completed)', () => {
    activeSession();
    const event = helperEvent('msg_2', { time: { created: Date.now() } }); // no .completed
    handleMessageUpdated(event, mockLf);
    expect(ACTIVE.get('ses_1').generations.size).toBe(0);
  });

  it('prevents duplicate generations for the same message ID', () => {
    activeSession();
    const event = helperEvent('msg_3');
    handleMessageUpdated(event, mockLf);
    handleMessageUpdated(event, mockLf); // second call
    expect(ACTIVE.get('ses_1').generations.size).toBe(1);
    expect(mockLf.generations).toHaveLength(1);
  });

  it('handles errors by calling generation.update with status and error metadata', () => {
    activeSession();
    const errMsg = 'rate limit exceeded';
    const event = helperEvent('msg_4', { error: errMsg });
    handleMessageUpdated(event, mockLf);

    const state = ACTIVE.get('ses_1');
    expect(state.generations.size).toBe(1);
    expect(mockLf.updates).toHaveLength(1);
    expect(mockLf.updates[0].status).toBe('error');
    expect(mockLf.updates[0].metadata.error).toBe(errMsg);
  });
});
