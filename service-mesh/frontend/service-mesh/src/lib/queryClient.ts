import { QueryClient } from '@tanstack/react-query'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { persister } from './persister'

/**
 * Shared TanStack Query client for the application.
 *
 * Default query options balance freshness with cache stability:
 * - `staleTime: 30_000` — data is considered fresh for 30 seconds.
 * - `gcTime: 3_600_000` — inactive cache entries are kept for 1 hour.
 * - `retry: 2` — transient failures are retried automatically.
 * - `refetchOnWindowFocus: true` — stale data is refreshed when the window
 *   regains focus.
 *
 * The client is persisted via {@link persister} (IDB by default, with a
 * localStorage fallback), providing offline-first behaviour.
 *
 * @sideEffects Registers a TanStack Query persistence subscription when the
 *              module is evaluated. Persists cache to IndexedDB/localStorage.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,       // 30s — data is fresh
      gcTime: 1000 * 60 * 60, // 1h — keep in cache
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
})

/**
 * Starts persisting the {@link queryClient} cache.
 *
 * Restores the cache on startup and writes updates to the configured
 * storage backend. Cached entries older than 24 hours are discarded.
 *
 * @sideEffects Reads existing persisted cache and subscribes to cache writes.
 */
void persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24, // 24h
})
