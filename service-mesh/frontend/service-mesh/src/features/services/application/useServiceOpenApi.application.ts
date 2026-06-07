import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { servicesApi, servicesKeys } from '../infrastructure/services.infrastructure'
import type { OpenApiDoc } from '../domain/types'

/**
 * Loads the OpenAPI document published by a specific service version.
 *
 * Retries are disabled because a missing or malformed OpenAPI document is
 * usually a configuration problem rather than a transient network failure.
 *
 * @param serviceId - Identifier of the service that owns the OpenAPI endpoint
 * @param version   - Optional version filter; when omitted the backend returns
 *                    the document for the default/active version
 * @returns TanStack Query result wrapping {@link OpenApiDoc}
 * @sideEffects Subscribes to a TanStack Query observer and performs HTTP GET
 *              on `/services/{serviceId}/openapi`.
 */
export function useServiceOpenApi(serviceId: string, version?: string): UseQueryResult<OpenApiDoc> {
  return useQuery({
    queryKey: servicesKeys.openapi(serviceId, version),
    queryFn:  () => servicesApi.getServiceOpenApi(serviceId, version),
    retry: false,
    staleTime: 30_000,
  })
}
