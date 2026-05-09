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

const CACHE_KEY = 'sm-query-cache-v2'

const useIdb: boolean =
  (import.meta.env.VITE_IDB_PERSIST as string | undefined) !== 'false'

// IDB-backed async persister — no size limit, non-blocking
const idbPersister: Persister = createAsyncStoragePersister({
  storage: {
    getItem:    (key) => get<string>(key),
    setItem:    (key, value) => set(key, value),
    removeItem: (key) => del(key),
  },
  key: CACHE_KEY,
})

// localStorage fallback — synchronous, ~5 MB cap
const localStoragePersister: Persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: CACHE_KEY,
})

export const persister: Persister = useIdb ? idbPersister : localStoragePersister
export { useIdb as isIdbPersisterEnabled }
