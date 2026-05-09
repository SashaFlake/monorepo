import { QueryClient } from '@tanstack/react-query'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { persistQueryClient } from '@tanstack/react-query-persist-client'

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

// Persist cache in localStorage for local-first behaviour.
// Can be swapped for an idb-keyval persister for larger payloads.
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'sm-query-cache',
})

void persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24, // 24h
})
