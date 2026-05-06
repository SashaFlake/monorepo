import { QueryClient } from '@tanstack/react-query'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { persister } from './persister'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30s — data is considered fresh
      gcTime:    1000 * 60 * 60, // 1h  — keep in memory / IDB
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
})

void persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24, // 24h — max age of persisted cache
})
