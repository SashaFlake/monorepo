import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { servicesApi, servicesKeys } from '../infrastructure/services.infrastructure'
import type { ServiceVersionsResponse } from '../domain/types'

export function useServiceDetail(serviceId: string): UseQueryResult<ServiceVersionsResponse> {
  return useQuery({
    queryKey: servicesKeys.versions(serviceId),
    queryFn:  () => servicesApi.getServiceVersions(serviceId),
    refetchInterval: 10_000,
    staleTime: 5_000,
  })
}
