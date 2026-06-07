import { Effect, Schema } from 'effect'

// ── Config ────────────────────────────────────────────────────────────────────

/**
 * Base URL for the control-plane REST API.
 *
 * Resolved from `import.meta.env.VITE_API_URL` at runtime; falls back to
 * `http://localhost:4000` when the environment variable is absent.
 *
 * @sideEffects Reads `import.meta.env` at module evaluation.
 */
export const BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000'

/**
 * Prefixes a relative API path with the versioned REST root.
 *
 * @param path - Relative path (e.g. `/services`)
 * @returns Absolute path including `/api/v1` prefix
 * @sideEffects none
 */
export const endpoint = (path: string): string => `/api/v1${path}`

// ── Typed error ─────────────────────────────────────────────────────────────────

/**
 * Structured error representing an HTTP or decode failure.
 *
 * Carries enough context (status, statusText, path) for the UI layer to
 * decide on retries, user-visible messages, and logging.
 */
export type ApiError = {
  readonly _tag:       'ApiError'
  readonly status:     number
  readonly statusText: string
  readonly path:       string
  readonly message:    string
}

/**
 * Factory for {@link ApiError} values.
 *
 * @param status     - HTTP status code (0 for network-level failures)
 * @param statusText - HTTP status text or exception message
 * @param path       - Request path that produced the error
 * @returns A branded {@link ApiError} record
 * @sideEffects none
 */
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

/**
 * Type guard that narrows an unknown value to {@link ApiError}.
 *
 * @param e - Value to inspect
 * @returns `true` when `e` is an object whose `_tag` equals `'ApiError'`
 * @sideEffects none
 */
export const isApiError = (e: unknown): e is ApiError =>
  typeof e === 'object' && e !== null && (e as ApiError)._tag === 'ApiError'

// ── Effect-based fetch (primary) ─────────────────────────────────────────────

/**
 * Performs a typed HTTP fetch wrapped in an `Effect` pipeline.
 *
 * The pipeline:
 *   1. Wraps `fetch` in `Effect.tryPromise` to catch network errors.
 *   2. Fails with {@link ApiError} for non-2xx HTTP statuses.
 *   3. Parses JSON and decodes it through the supplied Effect `Schema`.
 *
 * Because the result is an `Effect`, callers can compose retries, timeouts,
 * and error recovery without leaving the Effect runtime.
 *
 * @template T - Decoded response type
 * @template I - Intermediate JSON type (defaults to `unknown`)
 * @param path   - Full request path (usually produced by {@link endpoint})
 * @param schema - Effect schema used to validate and decode the response body
 * @param init   - Optional `RequestInit` (method, headers, body, etc.)
 * @returns `Effect<T, ApiError>` representing the decoded response
 * @sideEffects Performs one HTTP request when executed by the Effect runtime.
 *
 * @example
 * ```ts
 * apiFetchEffect<Service[]>(endpoint('/services'), ServiceViewSchema).pipe(
 *   Effect.retry({ times: 3 }),
 *   Effect.timeout('5 seconds'),
 * )
 * ```
 */
export const apiFetchEffect = <T, I = unknown>(
  path: string,
  schema: Schema.Schema<T, I>,
  init?: RequestInit,
): Effect.Effect<T, ApiError> =>
  Effect.tryPromise({
    try:   () => fetch(`${BASE}${path}`, init),
    catch: (e) => makeApiError(0, String(e), path),
  }).pipe(
    Effect.flatMap((res) =>
      res.ok
        ? Effect.tryPromise({
            try:   () => res.json(),
            catch: (e) => makeApiError(res.status, String(e), path),
          }).pipe(
            Effect.flatMap((json) =>
              Schema.decodeUnknown(schema)(json).pipe(
                Effect.mapError((err) => makeApiError(422, `Decode error: ${String(err)}`, path)),
              ),
            ),
          )
        : Effect.fail(makeApiError(res.status, res.statusText, path)),
    ),
  )

/**
 * Promise wrapper around {@link apiFetchEffect} for compatibility with
 * TanStack Query and other Promise-based consumers.
 *
 * @template T - Decoded response type
 * @template I - Intermediate JSON type
 * @param path   - Full request path
 * @param schema - Effect schema for response decoding
 * @param init   - Optional `RequestInit`
 * @returns Promise that resolves to `T` or rejects with {@link ApiError}
 * @sideEffects Runs the Effect runtime and performs one HTTP request.
 */
export const apiFetch = <T, I = unknown>(path: string, schema: Schema.Schema<T, I>, init?: RequestInit): Promise<T> =>
  Effect.runPromise(apiFetchEffect<T, I>(path, schema, init))

/**
 * Effect-based fetch for void endpoints (e.g. `DELETE`).
 *
 * Identical to {@link apiFetchEffect} except it expects an empty response body
 * and succeeds with `void` for 2xx statuses.
 *
 * @param path - Full request path
 * @param init - Optional `RequestInit`
 * @returns `Effect<void, ApiError>`
 * @sideEffects Performs one HTTP request when executed.
 */
export const apiFetchVoidEffect = (
  path: string,
  init?: RequestInit,
): Effect.Effect<void, ApiError> =>
  Effect.tryPromise({
    try:   () => fetch(`${BASE}${path}`, init),
    catch: (e) => makeApiError(0, String(e), path),
  }).pipe(
    Effect.flatMap((res) =>
      res.ok
        ? Effect.void
        : Effect.fail(makeApiError(res.status, res.statusText, path)),
    ),
  )

/**
 * Promise wrapper around {@link apiFetchVoidEffect}.
 *
 * @param path - Full request path
 * @param init - Optional `RequestInit`
 * @returns Promise that resolves to `void` or rejects with {@link ApiError}
 * @sideEffects Runs the Effect runtime and performs one HTTP request.
 */
export const apiFetchVoid = (path: string, init?: RequestInit): Promise<void> =>
  Effect.runPromise(apiFetchVoidEffect(path, init))
