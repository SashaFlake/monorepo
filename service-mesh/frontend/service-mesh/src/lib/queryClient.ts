import { QueryClient } from '@tanstack/react-query'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { persister } from './persister'

// gcTime must be greater than staleTime so entries are not evicted from the
// in-memory cache before the async IDB persister has a chance to write them.
// Rule of thumb: gcTime >= maxAge used in persistQueryClient below.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,            // 30s — data is fresh
      gcTime: 1000 * 60 * 60 * 24, // 24h — matches maxAge, prevents premature eviction
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
})

// Persist to IndexedDB via idb-keyval (no 5 MB cap, non-blocking).
// Falls back to localStorage when VITE_IDB_PERSIST=false (see persister.ts).
void persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24, // 24h
})
