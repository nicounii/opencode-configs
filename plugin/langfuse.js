import { Langfuse } from 'langfuse';

const ACTIVE = new Map();

function getClient() {
  const pk = process.env.LANGFUSE_PUBLIC_KEY;
  const sk = process.env.LANGFUSE_SECRET_KEY;
  const host = process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com';
  if (!pk || !sk) return null;
  if (!getClient._instance) {
    getClient._instance = new Langfuse({
      publicKey: pk,
      secretKey: sk,
      baseUrl: host,
      flushAt: 10,
      flushInterval: 5000,
    });
  }
  return getClient._instance;
}

// Safe wrapper: never let LangFuse errors affect OpenCode
function safe(fn) {
  return (...args) => { try { fn(...args); } catch (_) {} };
}

function handleSessionCreated(event, lf) {
  const { id, title, projectID, time } = event.properties.info;
  // Guard against duplicate session.created events (e.g., resume)
  if (ACTIVE.has(id)) return;

  const trace = lf.trace({
    id,
    name: title || 'OpenCode Session',
    userId: process.env.USER || process.env.USERNAME,
    metadata: {
      projectID,
      source: 'opencode',
      plugin: 'langfuse-plugin',
    },
    tags: ['opencode'],
  });
  ACTIVE.set(id, {
    traceId: id,
    trace,
    generations: new Map(),
    spans: new Map(),
    fileChanges: [],
    createdAt: time.created,
  });
}

function handleMessageUpdated(event, lf) {
  const info = event.properties.info;
  if (info.role !== 'assistant') return;
  if (!info.time?.completed) return;

  const state = ACTIVE.get(info.sessionID);
  if (!state) return;
  if (state.generations.has(info.id)) return;

  const generation = lf.generation({
    traceId: state.traceId,
    id: info.id,
    name: `LLM: ${info.modelID || info.providerID}`,
    model: info.modelID,
    modelParameters: {
      provider: info.providerID,
      mode: info.mode,
    },
    usage: {
      input: info.tokens?.input,
      output: info.tokens?.output,
      total: (info.tokens?.input || 0) + (info.tokens?.output || 0),
    },
    cost: info.cost,
    startTime: new Date(info.time.created).getTime(),
    endTime: new Date(info.time.completed).getTime(),
    metadata: {
      sessionID: info.sessionID,
      finishReason: info.finish,
      reasoningTokens: info.tokens?.reasoning,
      cacheRead: info.tokens?.cache?.read,
      cacheWrite: info.tokens?.cache?.write,
    },
    tags: ['opencode', 'llm'],
    // Store generation client only — tool spans are tracked via session-level state.spans
  });
  state.generations.set(info.id, generation);

  if (info.error) {
    generation.update({ status: 'error', metadata: { ...generation.metadata, error: info.error } });
  }
}

function handlePartUpdated(event, lf) {
  const part = event.properties.part;
  if (part.type !== 'tool') return;

  const state = ACTIVE.get(part.sessionID);
  if (!state) return;

  // Find parent generation by messageID or latest
  const parentGen = getLatestGeneration(state, part.messageID);
  if (!parentGen) return;

  const toolState = part.state;

  switch (toolState.status) {
    case 'pending':
    case 'running': {
      if (state.spans.has(part.callID)) break;
      try {
        const span = lf.span({
          traceId: state.traceId,
          name: `Tool: ${part.tool}`,
          parentObservationId: parentGen.id,
          startTime: toolState.time?.start
            ? new Date(toolState.time.start).getTime()
            : Date.now(),
          input: toolState.input,
          metadata: { callID: part.callID, tool: part.tool },
          tags: ['opencode', 'tool'],
        });
        state.spans.set(part.callID, span);
      } catch (_) {
        // LangFuse SDK error — silently skip
      }
      break;
    }
    case 'completed': {
      // Create span on-the-fly if pending/running was missed
      if (!state.spans.has(part.callID)) {
        try {
          const span = lf.span({
            traceId: state.traceId,
            name: `Tool: ${part.tool}`,
            parentObservationId: parentGen.id,
            startTime: toolState.time?.start
              ? new Date(toolState.time.start).getTime()
              : Date.now(),
            input: toolState.input,
            metadata: { callID: part.callID, tool: part.tool },
            tags: ['opencode', 'tool'],
          });
          state.spans.set(part.callID, span);
        } catch (_) {
          break;
        }
      }
      const span = state.spans.get(part.callID);
      if (!span) break;
      try {
        span.end({
          endTime: new Date(toolState.time.end).getTime(),
          output: toolState.output,
          metadata: { ...span.metadata, title: toolState.title },
        });
      } catch (_) {}
      state.spans.delete(part.callID);
      break;
    }
    case 'error': {
      if (!state.spans.has(part.callID)) break;
      const span = state.spans.get(part.callID);
      try {
        span.end({
          endTime: new Date(toolState.time.end).getTime(),
          status: 'error',
          metadata: { ...span.metadata, error: toolState.error },
        });
      } catch (_) {}
      state.spans.delete(part.callID);
      break;
    }
  }
}

function getLatestGeneration(state, messageID) {
  if (state.generations.has(messageID)) {
    return state.generations.get(messageID);
  }
  const entries = [...state.generations.entries()];
  if (entries.length > 0) return entries[entries.length - 1][1];
  return null;
}

function handleSessionDiff(event, lf) {
  const state = ACTIVE.get(event.properties.sessionID);
  if (!state) return;
  state.fileChanges.push(...event.properties.diff);
}

function handleSessionError(event, lf) {
  const { sessionID, error } = event.properties;
  if (!sessionID) return;
  const state = ACTIVE.get(sessionID);
  if (!state) return;
  state.trace.update({
    metadata: {
      ...state.trace.metadata,
      error: error?.name,
      errorMessage: error?.data?.message,
    },
  });
}

function handleSessionDeleted(event, lf) {
  const { id } = event.properties.info;
  const state = ACTIVE.get(id);
  if (!state) return;

  const fileSummary = state.fileChanges.reduce(
    (acc, f) => {
      acc.totalFiles++;
      acc.totalAdditions += f.additions;
      acc.totalDeletions += f.deletions;
      return acc;
    },
    { totalFiles: 0, totalAdditions: 0, totalDeletions: 0 }
  );

  state.trace.update({
    metadata: {
      ...state.trace.metadata,
      ...fileSummary,
      durationMs: Date.now() - state.createdAt * 1000,
    },
  });
  ACTIVE.delete(id);
}

export { handleSessionCreated, handleSessionDeleted, handleMessageUpdated, handleSessionDiff, handleSessionError, handlePartUpdated, getLatestGeneration };
export { ACTIVE };
export const LangfusePlugin = async () => {
  return {
    event: async ({ event }) => {
      const lf = getClient();
      if (!lf) return;
      switch (event.type) {
        case 'session.created':
          safe(handleSessionCreated)(event, lf);
          break;
        case 'message.updated':
          safe(handleMessageUpdated)(event, lf);
          break;
        case 'message.part.updated':
          safe(handlePartUpdated)(event, lf);
          break;
        case 'session.diff':
          safe(handleSessionDiff)(event, lf);
          break;
        case 'session.error':
          safe(handleSessionError)(event, lf);
          break;
        case 'session.deleted':
          safe(handleSessionDeleted)(event, lf);
          break;
      }
    }
  };
};

process.on('exit', () => {
  const lf = getClient._instance;
  if (lf) lf.flushAsync?.().catch(() => {});
});
