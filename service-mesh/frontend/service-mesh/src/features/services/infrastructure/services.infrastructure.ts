// ── Services domain API ───────────────────────────────────────────────────────
// HTTP-клиент и query keys для домена services/instances/openapi.
// Типы домена — в ../domain/services.types.ts
// HTTP-helper — из lib/http.ts

import { Schema } from 'effect'
import { apiFetch, apiFetchVoid, endpoint } from '@/lib/http'
import type {
  ServiceView,
  ServiceVersionsResponse,
  InstanceView,
  OpenApiDoc,
  Labels,
} from '../domain/services.types'
import {
  ServiceViewSchema,
  ServiceVersionsResponseSchema,
  InstanceViewSchema,
  OpenApiDocSchema,
} from '../domain/services.dto'

/**
 * TanStack Query keys for the services bounded context.
 *
 * Used to tag, invalidate, and refetch service-related queries.
 *
 * @sideEffects none
 */
export const servicesKeys = {
  /** Root key shared by all service queries. */
  all:      ['registry'] as const,

  /** Key for the service list query. */
  list:     () => [...servicesKeys.all, 'list']                        as const,

  /** Key for a single service detail query. */
  service:  (id: string) => [...servicesKeys.all, 'service', id]       as const,

  /** Key for the version-grouped detail query. */
  versions: (id: string) => [...servicesKeys.all, 'versions', id]      as const,

  /** Key for the OpenAPI document query. */
  openapi:  (id: string, version?: string) =>
    [...servicesKeys.all, 'openapi', id, version ?? '']                as const,
}

/**
 * REST client for the services / instances endpoints.
 *
 * All methods decode responses through Effect schemas defined in
 * {@link ../domain/services.dto} so that runtime validation is enforced at the
 * infrastructure boundary.
 *
 * @sideEffects Performs HTTP requests when called.
 */
export const servicesApi = {
  /**
   * Fetches the full list of registered services.
   *
   * @returns Promise resolving to an array of {@link ServiceView}
   * @sideEffects HTTP GET `/api/v1/services`
   */
  listServices: (): Promise<ServiceView[]> =>
    apiFetch(endpoint('/services'), Schema.mutable(Schema.Array(ServiceViewSchema))),

  /**
   * Fetches a single service by ID.
   *
   * @param id - Service identifier
   * @returns Promise resolving to {@link ServiceView}
   * @sideEffects HTTP GET `/api/v1/services/{id}`
   */
  getService: (id: string): Promise<ServiceView> =>
    apiFetch(endpoint(`/services/${id}`), ServiceViewSchema),

  /**
   * Registers a new service.
   *
   * @param name   - Human-readable service name
   * @param labels - Optional labels dictionary
   * @returns Promise resolving to the created {@link ServiceView}
   * @sideEffects HTTP POST `/api/v1/services`
   */
  createService: (name: string, labels?: Labels): Promise<ServiceView> =>
    apiFetch(endpoint('/services'), ServiceViewSchema, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, labels }),
    }),

  /**
   * Deletes a service by ID.
   *
   * @param id - Service identifier
   * @returns Promise resolving to `void`
   * @sideEffects HTTP DELETE `/api/v1/services/{id}`
   */
  deleteService: (id: string): Promise<void> =>
    apiFetchVoid(endpoint(`/services/${id}`), { method: 'DELETE' }),

  /**
   * Fetches version-grouped details for a service.
   *
   * @param id - Service identifier
   * @returns Promise resolving to {@link ServiceVersionsResponse}
   * @sideEffects HTTP GET `/api/v1/services/{id}/versions`
   */
  getServiceVersions: (id: string): Promise<ServiceVersionsResponse> =>
    apiFetch(endpoint(`/services/${id}/versions`), ServiceVersionsResponseSchema),

  /**
   * Fetches the OpenAPI document published by a service version.
   *
   * @param id      - Service identifier
   * @param version - Optional version query parameter
   * @returns Promise resolving to {@link OpenApiDoc}
   * @sideEffects HTTP GET `/api/v1/services/{id}/openapi`
   */
  getServiceOpenApi: (id: string, version?: string): Promise<OpenApiDoc> => {
    const qs = version ? `?version=${encodeURIComponent(version)}` : ''
    return apiFetch(endpoint(`/services/${id}/openapi${qs}`), OpenApiDocSchema)
  },

  /**
   * Registers a new instance under an existing service.
   *
   * @param input - Instance registration payload
   * @returns Promise resolving to the created {@link InstanceView}
   * @sideEffects HTTP POST `/api/v1/instances`
   */
  registerInstance: (input: {
    serviceId:   string
    host:        string
    port:        number
    healthPath?: string
    metadata?:   Record<string, string>
  }): Promise<InstanceView> =>
    apiFetch(endpoint('/instances'), InstanceViewSchema, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),

  /**
   * Deregisters an instance by ID.
   *
   * @param id - Instance identifier
   * @returns Promise resolving to `void`
   * @sideEffects HTTP DELETE `/api/v1/instances/{id}`
   */
  deregisterInstance: (id: string): Promise<void> =>
    apiFetchVoid(endpoint(`/instances/${id}`), { method: 'DELETE' }),
}
