// Typed application errors so UI can branch on failure kind without matching
// error-message strings. Thrown from the API operation layer (e.g. getWorkspace)
// and surfaced through React Query's `error`, which passes the thrown instance
// through untouched — so `isNotFoundError(query.error)` works in route code.

// A requested resource does not exist (or the caller no longer has access).
// Distinct from a generic load failure: routes render a "not found" page rather
// than a retryable error, and never a session/logout path.
export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} was not found`);
    this.name = "NotFoundError";
  }
}

export const isNotFoundError = (error: unknown): error is NotFoundError =>
  error instanceof NotFoundError;
