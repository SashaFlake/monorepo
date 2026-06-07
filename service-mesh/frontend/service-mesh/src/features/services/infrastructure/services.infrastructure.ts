// ── Services domain API ───────────────────────────────────────────────────────
// HTTP-клиент и query keys для домена services/instances/openapi.
// Типы домена — в ../domain/types.ts
// HTTP-helper — из lib/http.ts

import { apiFetch, apiFetchVoid, endpoint } from '@/lib/http'
import type {
  ServiceView,
  ServiceVersionsResponse,
  InstanceView,
  OpenApiDoc,
  Labels,
} from '../domain/types'
import {
  ServiceViewSchema,
  ServiceVersionsResponseSchema,
  InstanceViewSchema,
  OpenApiDocSchema,
} from '../domain/schema'

// ── Query keys ────────────────────────────────────────────────────────────────

export const servicesKeys = {
  all:      ['registry'] as const,
  list:     () => [...servicesKeys.all, 'list']                        as const,
  service:  (id: string) => [...servicesKeys.all, 'service', id]       as const,
  versions: (id: string) => [...servicesKeys.all, 'versions', id]      as const,
  openapi:  (id: string, version?: string) =>
    [...servicesKeys.all, 'openapi', id, version ?? '']                as const,
}

// ── API client ────────────────────────────────────────────────────────────────

export const servicesApi = {
  listServices: (): Promise<ServiceView[]> =>
    apiFetch(endpoint('/services'), Schema.Array(ServiceViewSchema)),

  getService: (id: string): Promise<ServiceView> =>
    apiFetch(endpoint(`/services/${id}`), ServiceViewSchema),

  createService: (name: string, labels?: Labels): Promise<ServiceView> =>
    apiFetch(endpoint('/services'), ServiceViewSchema, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, labels }),
    }),

  deleteService: (id: string): Promise<void> =>
    apiFetchVoid(endpoint(`/services/${id}`), { method: 'DELETE' }),

  getServiceVersions: (id: string): Promise<ServiceVersionsResponse> =>
    apiFetch(endpoint(`/services/${id}/versions`), ServiceVersionsResponseSchema),

  getServiceOpenApi: (id: string, version?: string): Promise<OpenApiDoc> => {
    const qs = version ? `?version=${encodeURIComponent(version)}` : ''
    return apiFetch(endpoint(`/services/${id}/openapi${qs}`), OpenApiDocSchema)
  },

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

  deregisterInstance: (id: string): Promise<void> =>
    apiFetchVoid(endpoint(`/instances/${id}`), { method: 'DELETE' }),
}
