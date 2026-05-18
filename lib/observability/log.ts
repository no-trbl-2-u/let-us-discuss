/**
 * Structured error logger for Vercel's log drain.
 *
 * Writes a single JSON line to stdout per call. The line shape
 * is locked here and consumed by any downstream drain UI:
 *
 *   { level: 'error', scope, message, stack?, context?, ts }
 *
 * - `scope` is a short string like 'orchestrator', 'moderation',
 *   'auth', 'session-route' — drives log filtering.
 * - `context` is an optional flat object (no nested objects)
 *   so line size stays bounded in the drain UI.
 * - `ts` is ISO-8601.
 *
 * In NODE_ENV=test the helper is quiet by default; pass
 * { force: true } to assert the line shape from tests.
 */

export type LogScope =
  | 'orchestrator'
  | 'moderation'
  | 'auth'
  | 'session-route'
  | 'rate-limit'
  | 'data'
  | 'other'

export interface LogErrorOptions {
  /** Force a write even in NODE_ENV=test. */
  force?: boolean
}

export function logError(
  scope: LogScope,
  err: unknown,
  context?: Record<string, string | number | boolean | null>,
  options: LogErrorOptions = {},
): void {
  if (process.env.NODE_ENV === 'test' && !options.force) return

  const error =
    err instanceof Error
      ? { message: err.message, stack: err.stack }
      : { message: String(err) }

  const line = JSON.stringify({
    level: 'error',
    scope,
    message: error.message,
    ...(error.stack ? { stack: error.stack } : {}),
    ...(context ? { context } : {}),
    ts: new Date().toISOString(),
  })

  // Single write so the line stays atomic in the drain pipe.
  process.stdout.write(`${line}\n`)
}
