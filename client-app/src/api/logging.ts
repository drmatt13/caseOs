/*
 * Query and mutation debug logging.
 *
 * Enable with `VITE_LOG_QUERIES=true` or `VITE_LOG_QUERIES=1`.
 *
 * Logs only when React Query actually executes a `queryFn`, which indicates a
 * cache miss and a real fetch. Hook renders and cache hits stay quiet.
 *
 * Mutations log only when the mutation function executes.
 *
 * Uses `console.debug` instead of `console.log` to avoid TanStack devtools
 * decorating and replaying messages as duplicate `[Server] [Client]` logs.
 */

export function shouldLogQueries() {
  const value = import.meta.env.VITE_LOG_QUERIES;
  return value === "true" || value === "1";
}

export function logQueryCacheMiss(name: string, details?: unknown) {
  if (!shouldLogQueries()) return;

  if (details === undefined) {
    console.debug(`${name} cache miss`);
    return;
  }

  console.debug(`${name} cache miss`, details);
}

export function logMutationInvocation(name: string, details?: unknown) {
  if (!shouldLogQueries()) return;

  if (details === undefined) {
    console.debug(`${name} mutation invoked`);
    return;
  }

  console.debug(`${name} mutation invoked`, details);
}
