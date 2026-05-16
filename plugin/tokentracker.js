// TOKENTRACKER_PLUGIN
const notifyPath = "/home/mathew/.tokentracker/bin/notify.cjs";
export const TokenTrackerPlugin = async ({ $ }) => {
  return {
    event: async ({ event }) => {
      if (!event || event.type !== "session.updated") return;
      try {
        if (!notifyPath) return;
        const proc = $`/usr/bin/env node ${notifyPath} --source=opencode`;
        if (proc && typeof proc.catch === 'function') proc.catch(() => {});
      } catch (_) {}
    }
  };
};
