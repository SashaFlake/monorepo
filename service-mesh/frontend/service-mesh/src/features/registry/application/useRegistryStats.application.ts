import { useQuery } from '@tanstack/react-query'
import { registryApi, registryKeys } from '../infrastructure/registry.infrastructure'
import type { ServiceView } from '@/features/services'
import type { RegistryStats, UseRegistryStatsResult } from '../domain/registry.types'

/**
 * Zero-valued {@link RegistryStats} used as a safe fallback while loading.
 *
 * Keeps the UI stable and avoids conditional rendering gymnastics during
 * the initial fetch.
 *
 * @sideEffects none
 */
const EMPTY_STATS: RegistryStats = {
  totalServices:     0,
  totalInstances:    0,
  passingInstances:  0,
  degradedInstances: 0,
  criticalInstances: 0,
}

/**
 * Derives aggregate registry statistics from a list of services.
 *
 * Flattens instances across services and counts them by status.
 * Services without instances contribute only to `totalServices`.
 *
 * @param services - Array of services returned by the backend
 * @returns Aggregated {@link RegistryStats}
 * @sideEffects none
 */
const calcStats = (services: ServiceView[]): RegistryStats => {
  const instances = services.flatMap(s => s.instances)
  return {
    totalServices:     services.length,
    totalInstances:    instances.length,
    passingInstances:  instances.filter(i => i.status === 'passing').length,
    degradedInstances: instances.filter(i => i.status === 'warning').length,
    criticalInstances: instances.filter(i => i.status === 'critical').length,
  }
}

/**
 * React hook that loads the service registry and derives dashboard statistics.
 *
 * Polls the registry every 10 seconds so the dashboard stays up to date
 * with heartbeat-driven status changes.
 *
 * @returns Object containing stats, services, and UI flags (see {@link UseRegistryStatsResult})
 * @sideEffects Subscribes to a TanStack Query observer; performs HTTP GET on
 *              the `/services` endpoint and re-fetches on the configured interval.
 */
export function useRegistryStats(): UseRegistryStatsResult {
  const { data, isLoading, isError, dataUpdatedAt } = useQuery({
    queryKey: registryKeys.list(),
    queryFn:  registryApi.listServices,
    refetchInterval: 10_000,
    staleTime: 5_000,
  })

  const services = data ?? []

  return {
    stats:     isLoading ? EMPTY_STATS : calcStats(services),
    services,
    isLoading,
    isError,
    updatedAt: dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : null,
  }
}
