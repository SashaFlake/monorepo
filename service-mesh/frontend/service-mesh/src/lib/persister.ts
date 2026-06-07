// ── Query cache persister ─────────────────────────────────────────────────────
//
// Feature flag: VITE_IDB_PERSIST
//   'true'  (default) — IndexedDB via idb-keyval   → async, no 5 MB cap
//   'false'           — localStorage (sync)        → fallback / SSR-safe
//
// Cache key is versioned ('v2') so stale localStorage entries from the
// previous setup are never deserialised after switching to IDB.

import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { get, set, del } from 'idb-keyval'
import type { Persister } from '@tanstack/react-query-persist-client'

/**
 * Versioned cache key used for TanStack Query persistence.
 *
 * Bumping this value invalidates previously persisted caches after
 * breaking schema or storage backend changes.
 *
 * @sideEffects none
 */
const CACHE_KEY = 'sm-query-cache-v2'

/**
 * Whether the IndexedDB-backed persister is enabled.
 *
 * Controlled by `import.meta.env.VITE_IDB_PERSIST`. Defaults to `true`
 * unless explicitly set to `'false'`.
 *
 * @sideEffects Reads `import.meta.env` at module evaluation.
 */
const useIdb: boolean =
  (import.meta.env.VITE_IDB_PERSIST as string | undefined) !== 'false'

/**
 * IDB-backed async persister.
 *
 * Uses `idb-keyval` for storage, removing the ~5 MB limit imposed by
 * `localStorage`. Suitable for large query caches and non-blocking writes.
 *
 * @sideEffects Reads from / writes to IndexedDB when the persister runs.
 */
const idbPersister: Persister = createAsyncStoragePersister({
  storage: {
    getItem:    (key) => get<string>(key),
    setItem:    (key, value) => set(key, value),
    removeItem: (key) => del(key),
  },
  key: CACHE_KEY,
})

/**
 * localStorage fallback persister.
 *
 * Synchronous and capped at roughly 5 MB. Only instantiated when IDB is
 * disabled or when `window` is unavailable.
 *
 * @sideEffects Reads from / writes to `window.localStorage` when executed.
 */
const localStoragePersister: Persister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : noopStorage(),
  key: CACHE_KEY,
})

/**
 * Active persister exported for `persistQueryClient`.
 *
 * Chooses {@link idbPersister} by default and falls back to
 * {@link localStoragePersister} when `VITE_IDB_PERSIST` is `'false'`.
 *
 * @sideEffects none at import time; delegates storage I/O to the chosen persister.
 */
export const persister: Persister = useIdb ? idbPersister : localStoragePersister

/**
 * Re-exported flag so consumers can branch on the active persister kind.
 *
 * @sideEffects none
 */
export { useIdb as isIdbPersisterEnabled }

/**
 * Creates a no-op storage object for SSR environments where `window` is absent.
 *
 * @returns A `Storage`-like object whose methods resolve immediately and do nothing.
 * @sideEffects none
 */
function noopStorage(): Storage {
  return {
    getItem:    () => null,
    setItem:    () => undefined,
    removeItem: () => undefined,
    clear:      () => undefined,
    key:        () => null,
    length:     0,
  }
}
