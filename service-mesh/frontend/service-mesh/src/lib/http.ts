import { Effect } from 'effect'

// ── Config ────────────────────────────────────────────────────────────────────

export const BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000'

export const endpoint = (path: string): string => `/api/v1${path}`

// ── Typed error ─────────────────────────────────────────────────────────────────

export type ApiError = {
  readonly _tag:       'ApiError'
  readonly status:     number
  readonly statusText: string
  readonly path:       string
  readonly message:    string
}

export const makeApiError = (
  status: number,
  statusText: string,
  path: string,
): ApiError => ({
  _tag:       'ApiError',
  status,
  statusText,
  path,
  message: `${status} ${statusText}: ${path}`,
})

export const isApiError = (e: unknown): e is ApiError =>
  typeof e === 'object' && e !== null && (e as ApiError)._tag === 'ApiError'

// ── Effect-based fetch (primary) ─────────────────────────────────────────────
//
// Returns Effect<T, ApiError, never>.
// Compose with Effect.retry, Effect.timeout, Effect.catchTag, etc.
//
// Example:
//   apiFetchEffect<Service[]>(endpoint('/services')).pipe(
//     Effect.retry({ times: 3 }),
//     Effect.timeout('5 seconds'),
//   )
//
// Pipeline:
//   1. tryPromise catches network-level throws (DNS, CORS, etc.) → ApiError
//   2. flatMap inspects HTTP status → Effect.fail for non-ok, Effect.succeed for ok
//   3. flatMap parses JSON → typed T

export const apiFetchEffect = <T>(
  path: string,
  init?: RequestInit,
): Effect.Effect<T, ApiError> =>
  Effect.tryPromise({
    try:   () => fetch(`${BASE}${path}`, init),
    catch: (e) => makeApiError(0, String(e), path),
  }).pipe(
    Effect.flatMap((res) =>
      res.ok
        ? Effect.tryPromise({
            try:   () => res.json() as Promise<T>,
            catch: (e) => makeApiError(res.status, String(e), path),
          })
        : Effect.fail(makeApiError(res.status, res.statusText, path)),
    ),
  )

// ── Promise-based fetch (compatibility wrapper) ────────────────────────────
//
// Thin wrapper for existing api clients — TanStack Query consumes Promise.
// Migrate call sites to apiFetchEffect incrementally when retry / timeout
// or structured error handling is needed per-query.

export const apiFetch = <T>(path: string, init?: RequestInit): Promise<T> =>
  Effect.runPromise(apiFetchEffect<T>(path, init))
