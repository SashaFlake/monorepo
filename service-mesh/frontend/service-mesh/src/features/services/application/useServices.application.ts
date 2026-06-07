import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { servicesApi, servicesKeys } from '../infrastructure/services.infrastructure'
import type { ServiceView } from '../domain/types'

export function useServices(): UseQueryResult<ServiceView[]> {
  return useQuery({
    queryKey: servicesKeys.list(),
    queryFn:  servicesApi.listServices,
    refetchInterval: 10_000,
    staleTime: 5_000,
  })
}
