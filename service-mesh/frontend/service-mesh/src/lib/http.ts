import { Effect } from 'effect'

// ── Config ────────────────────────────────────────────────────────────────────

export const BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000'

export const endpoint = (path: string): string => `/api/v1${path}`

// ── Typed error ─────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly path: string,
  ) {
    super(`${status} ${statusText}: ${path}`)
    this.name = 'ApiError'
  }
}

// ── Effect-based fetch (primary) ─────────────────────────────────────────────
//
// Returns Effect<T, ApiError, never>.
// Compose with Effect.retry, Effect.timeout, Effect.catchTag, etc.
//
// Example with retry + timeout:
//   apiFetchEffect<Service[]>(endpoint('/services'))
//     .pipe(
//       Effect.retry({ times: 3 }),
//       Effect.timeout('5 seconds'),
//     )

export const apiFetchEffect = <T>(
  path: string,
  init?: RequestInit,
): Effect.Effect<T, ApiError> =>
  Effect.tryPromise({
    try: async () => {
      const res = await fetch(`${BASE}${path}`, init)
      if (!res.ok) throw new ApiError(res.status, res.statusText, path)
      return res.json() as Promise<T>
    },
    catch: (e) => e instanceof ApiError
      ? e
      : new ApiError(0, String(e), path),
  })

// ── Promise-based fetch (compatibility wrapper) ────────────────────────────
//
// Thin wrapper around apiFetchEffect for existing api clients.
// TanStack Query consumes Promise — no migration needed on call sites.
// Migrate call sites to apiFetchEffect incrementally when retry/timeout
// or structured error handling is needed per-query.

export const apiFetch = <T>(path: string, init?: RequestInit): Promise<T> =>
  Effect.runPromise(apiFetchEffect<T>(path, init))
