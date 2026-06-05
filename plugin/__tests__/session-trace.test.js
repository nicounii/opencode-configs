import { describe, it, expect, beforeEach } from 'bun:test';
import { handleSessionCreated, handleSessionDeleted, handleSessionDiff, handleSessionError } from '../langfuse.js';

/**
 * Helper: build a fake LangFuse trace object.
 */
function fakeTrace(initialMetadata) {
  let _metadata = { ...(initialMetadata || {}) };
  let _props = {};
  return {
    update: (updates) => {
      // LangFuse SDK: nested merge for metadata
      if (updates.metadata && typeof updates.metadata === 'object') {
        _metadata = { ..._metadata, ...updates.metadata };
        delete updates.metadata;
      }
      _props = { ..._props, ...updates };
    },
    get metadata() { return _metadata; },
  };
}

function fakeClient() {
  const traces = [];
  return {
    trace: (opts) => {
      const m = fakeTrace(opts.metadata);
      const t = { ...opts };
      // Use defineProperty so metadata getter stays live (closure reference)
      t.update = m.update;
      Object.defineProperty(t, 'metadata', { get: () => m.metadata, enumerable: true });
      traces.push(t);
      return t;
    },
    get traces() { return traces; },
  };
}
/**
 * Build a minimal session.created event.
 */
function sessionCreatedEvent(id, overrides = {}) {
  return {
    type: 'session.created',
    properties: {
      info: {
        id,
        title: overrides.title ?? 'Test Session',
        projectID: overrides.projectID ?? 'proj_1',
        time: { created: Date.now() / 1000 },
        ...overrides,
      },
    },
  };
}

/**
 * Build a minimal session.deleted event.
 */
function sessionDeletedEvent(id) {
  return {
    type: 'session.deleted',
    properties: {
      info: { id },
    },
  };
}

describe('session trace lifecycle', () => {
  let lf;

  beforeEach(() => {
    lf = fakeClient();
  });

  it('handleSessionCreated creates a LangFuse trace', () => {
    const event = sessionCreatedEvent('ses_create_1');
    handleSessionCreated(event, lf);

    expect(lf.traces).toHaveLength(1);
    expect(lf.traces[0].id).toBe('ses_create_1');
    expect(lf.traces[0].name).toBe('Test Session');
    expect(lf.traces[0].tags).toContain('opencode');
  });

  it('handleSessionCreated deduplicates on same id', () => {
    const event = sessionCreatedEvent('ses_dedup_1');
    handleSessionCreated(event, lf);
    handleSessionCreated(event, lf);

    // Only one trace created despite 2 calls
    expect(lf.traces).toHaveLength(1);
  });

  it('handleSessionDeleted updates trace with file summary', () => {
    const createEvent = sessionCreatedEvent('ses_update_1');
    handleSessionCreated(createEvent, lf);

    const delEvent = sessionDeletedEvent('ses_update_1');
    handleSessionDeleted(delEvent, lf);

    // After delete, trace.metadata should contain fileSummary keys
    const trace = lf.traces[0];
    expect(trace.metadata).toHaveProperty('totalFiles');
    expect(trace.metadata).toHaveProperty('totalAdditions');
    expect(trace.metadata).toHaveProperty('totalDeletions');
    expect(trace.metadata).toHaveProperty('durationMs');
  });

  it('handleSessionDeleted clears active state', () => {
    const createEvent = sessionCreatedEvent('ses_clear_1');
    handleSessionCreated(createEvent, lf);

    const delEvent = sessionDeletedEvent('ses_clear_1');
    handleSessionDeleted(delEvent, lf);

    // Calling delete again should be a no-op (state already cleared)
    handleSessionDeleted(delEvent, lf);
    expect(lf.traces).toHaveLength(1); // Still just one trace
  });

  it('handleSessionDeleted is a no-op for unknown sessions', () => {
    const delEvent = sessionDeletedEvent('never_created');
    // Should not throw
    expect(() => handleSessionDeleted(delEvent, lf)).not.toThrow();
  });

  /**
   * Build a minimal session.diff event.
   */
  function sessionDiffEvent(sessionID, diff) {
    return {
      type: 'session.diff',
      properties: { sessionID, diff },
    };
  }

  /**
   * Build a minimal session.error event.
   */
  function sessionErrorEvent(sessionID, error) {
    return {
      type: 'session.error',
      properties: { sessionID, error },
    };
  }

  describe('handleSessionDiff', () => {
    beforeEach(() => {
      lf = fakeClient();
    });

    it('accumulates file diffs into state.fileChanges', () => {
      const sessionId = 'ses_diff_1';
      handleSessionCreated(sessionCreatedEvent(sessionId), lf);

      const diff1 = [
        { file: 'a.js', additions: 10, deletions: 2 },
        { file: 'b.js', additions: 5, deletions: 0 },
      ];
      handleSessionDiff(sessionDiffEvent(sessionId, diff1), lf);

      const diff2 = [
        { file: 'c.js', additions: 3, deletions: 1 },
      ];
      handleSessionDiff(sessionDiffEvent(sessionId, diff2), lf);

      // Need to access ACTIVE state - but it's internal. We'll verify through final trace update on delete.
      const delEvent = sessionDeletedEvent(sessionId);
      handleSessionDeleted(delEvent, lf);

      const trace = lf.traces[0];
      expect(trace.metadata.totalFiles).toBe(3);
      expect(trace.metadata.totalAdditions).toBe(18); // 10+5+3
      expect(trace.metadata.totalDeletions).toBe(3); // 2+0+1
    });

    it('is a no-op when sessionID is missing', () => {
      const event = { type: 'session.diff', properties: { diff: [] } };
      expect(() => handleSessionDiff(event, lf)).not.toThrow();
    });

    it('is a no-op when session not found', () => {
      const event = sessionDiffEvent('unknown_session', []);
      expect(() => handleSessionDiff(event, lf)).not.toThrow();
    });
  });

  describe('handleSessionError', () => {
    beforeEach(() => {
      lf = fakeClient();
    });

    it('updates trace metadata with error name and message', () => {
      const sessionId = 'ses_error_1';
      handleSessionCreated(sessionCreatedEvent(sessionId), lf);

      const error = { name: 'TestError', data: { message: 'Something went wrong' } };
      handleSessionError(sessionErrorEvent(sessionId, error), lf);

      const trace = lf.traces[0];
      expect(trace.metadata.error).toBe('TestError');
      expect(trace.metadata.errorMessage).toBe('Something went wrong');
    });

    it('handles missing error fields gracefully', () => {
      const sessionId = 'ses_error_2';
      handleSessionCreated(sessionCreatedEvent(sessionId), lf);

      // Error with no data.message
      const error = { name: 'PartialError' };
      handleSessionError(sessionErrorEvent(sessionId, error), lf);

      const trace = lf.traces[0];
      expect(trace.metadata.error).toBe('PartialError');
      expect(trace.metadata.errorMessage).toBeUndefined();
    });

    it('is a no-op when sessionID is missing', () => {
      const event = { type: 'session.error', properties: {} };
      expect(() => handleSessionError(event, lf)).not.toThrow();
    });

    it('is a no-op when session not found', () => {
      const event = sessionErrorEvent('unknown_session', { name: 'Err' });
      expect(() => handleSessionError(event, lf)).not.toThrow();
    });
  });
});
