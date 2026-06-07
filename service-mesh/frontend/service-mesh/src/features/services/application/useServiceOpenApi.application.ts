import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { servicesApi, servicesKeys } from '../infrastructure/services.infrastructure'
import type { OpenApiDoc } from '../domain/types'

export function useServiceOpenApi(serviceId: string, version?: string): UseQueryResult<OpenApiDoc> {
  return useQuery({
    queryKey: servicesKeys.openapi(serviceId, version),
    queryFn:  () => servicesApi.getServiceOpenApi(serviceId, version),
    retry: false,
    staleTime: 30_000,
  })
}
