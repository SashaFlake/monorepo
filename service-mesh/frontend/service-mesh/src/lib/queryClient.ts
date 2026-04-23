import { QueryClient } from '@tanstack/react-query'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { persistQueryClient } from '@tanstack/react-query-persist-client'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30s — данные свежие
      gcTime: 1000 * 60 * 60,  // 1h — держим в кэше
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
})

// Персистим кэш в localStorage для local-first поведения
// Позже можно заменить на idb-keyval persister для большего объёма
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'sm-query-cache',
})

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24, // 24h
})
