/**
 * What went wrong with an outside service (AI or search), as words a person can read, e.g. "is over its usage limit".
 * Their raw errors are JSON meant for developers. Null when the error isn't a service failure.
 */
export function serviceProblem(err: unknown): string | null {
  if (!(err instanceof Error)) return null;
  if (err.name === 'AbortError' || err.name === 'TimeoutError') return "didn't answer in time";
  const status = (err as { status?: unknown }).status;
  if (typeof status !== 'number' || status < 400) return null;
  if (status === 429) return 'is over its usage limit';
  return `returned an error (HTTP ${status})`;
}
