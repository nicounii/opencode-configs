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
  // TODO: Implement tool execution tracking
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

export { handleSessionCreated, handleSessionDeleted, handleMessageUpdated, handleSessionDiff, handleSessionError };
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
