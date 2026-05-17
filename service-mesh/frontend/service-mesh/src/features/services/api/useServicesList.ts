// ── useServicesList ───────────────────────────────────────────────────────────
//
// Single source of truth for the services list query params.
// Both RegistryDashboard and ServicesPage consume the same queryKey, so
// TanStack Query deduplicates the network request — but previously each
// caller declared its own staleTime/refetchInterval inline, which could
// silently drift. This hook centralises those settings.

import { useQuery } from '@tanstack/react-query'
import { registryApi, registryKeys } from './api'
import type { ServiceView } from './types'

const SERVICES_LIST_QUERY = {
  refetchInterval: 10_000,
  staleTime:       5_000,
} as const

export type UseServicesListResult = {
  services:  ServiceView[]
  isLoading: boolean
  isError:   boolean
  updatedAt: number | null
}

export function useServicesList(): UseServicesListResult {
  const { data, isLoading, isError, dataUpdatedAt } = useQuery({
    queryKey: registryKeys.list(),
    queryFn:  registryApi.listServices,
    ...SERVICES_LIST_QUERY,
  })

  return {
    services:  data ?? [],
    isLoading,
    isError,
    updatedAt: dataUpdatedAt || null,
  }
}
