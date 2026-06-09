import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { servicesApi, servicesKeys } from '../infrastructure/services.infrastructure'
import type { ServiceView } from '../domain/services.types'

/**
 * Loads the full list of registered services.
 *
 * Refetches every 10 seconds so the list stays current with registration
 * and heartbeat events from the data plane.
 *
 * @returns TanStack Query result wrapping an array of {@link ServiceView}
 * @sideEffects Subscribes to a TanStack Query observer and performs HTTP GET
 *              on `/services` on the configured interval.
 */
export function useServices(): UseQueryResult<ServiceView[]> {
  return useQuery({
    queryKey: servicesKeys.list(),
    queryFn:  servicesApi.listServices,
    refetchInterval: 10_000,
    staleTime: 5_000,
  })
}
