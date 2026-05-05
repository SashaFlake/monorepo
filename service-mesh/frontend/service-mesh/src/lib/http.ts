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

export const apiFetchEffect = <T>(
  path: string,
  init?: RequestInit,
): Effect.Effect<T, ApiError> =>
  Effect.tryPromise({
    try: async () => {
      const res = await fetch(`${BASE}${path}`, init)
      if (!res.ok) throw makeApiError(res.status, res.statusText, path)
      return res.json() as Promise<T>
    },
    catch: (e) => isApiError(e)
      ? e
      : makeApiError(0, String(e), path),
  })

// ── Promise-based fetch (compatibility wrapper) ────────────────────────────
//
// Thin wrapper for existing api clients — TanStack Query consumes Promise.
// Migrate call sites to apiFetchEffect incrementally when retry / timeout
// or structured error handling is needed per-query.

export const apiFetch = <T>(path: string, init?: RequestInit): Promise<T> =>
  Effect.runPromise(apiFetchEffect<T>(path, init))
