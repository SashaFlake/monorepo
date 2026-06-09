import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { servicesApi, servicesKeys } from '../infrastructure/services.infrastructure'
import type { ServiceVersionsResponse } from '../domain/services.types'

/**
 * Loads version-grouped details for a single service.
 *
 * Polls every 10 seconds to keep instance lists and manifests in sync with
 * the data plane.
 *
 * @param serviceId - Identifier of the service to load
 * @returns TanStack Query result wrapping {@link ServiceVersionsResponse}
 * @sideEffects Subscribes to a TanStack Query observer and performs HTTP GET
 *              on `/services/{serviceId}/versions`.
 */
export function useServiceDetail(serviceId: string): UseQueryResult<ServiceVersionsResponse> {
  return useQuery({
    queryKey: servicesKeys.versions(serviceId),
    queryFn:  () => servicesApi.getServiceVersions(serviceId),
    refetchInterval: 10_000,
    staleTime: 5_000,
  })
}
