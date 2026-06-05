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
  // TODO: Implement session tracking
}

function handleMessageUpdated(event, lf) {
  // TODO: Implement message cost/token tracking
}

function handlePartUpdated(event, lf) {
  // TODO: Implement tool execution tracking
}

function handleSessionDiff(event, lf) {
  // TODO: Implement file change tracking
}

function handleSessionError(event, lf) {
  // TODO: Implement error reporting to LangFuse
}

function handleSessionDeleted(event, lf) {
  // TODO: Implement session cleanup
}

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
