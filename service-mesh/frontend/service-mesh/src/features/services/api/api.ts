// ── Services domain API ───────────────────────────────────────────────────────
// HTTP-клиент и query keys для домена services/instances/openapi.
// Типы домена — в ./types.ts
// HTTP-helper — из lib/http.ts

import { apiFetch, endpoint } from '@/lib/http'
import type {
  ServiceView,
  ServiceVersionsResponse,
  InstanceView,
  OpenApiDoc,
  Labels,
} from './types'

// ── Query keys ────────────────────────────────────────────────────────────────

export const registryKeys = {
  all:      ['registry'] as const,
  list:     () => [...registryKeys.all, 'list']                        as const,
  service:  (id: string) => [...registryKeys.all, 'service', id]       as const,
  versions: (id: string) => [...registryKeys.all, 'versions', id]      as const,
  openapi:  (id: string, version?: string) =>
    [...registryKeys.all, 'openapi', id, version ?? '']                as const,
}

// ── API client ────────────────────────────────────────────────────────────────

export const registryApi = {
  listServices: (): Promise<ServiceView[]> =>
    apiFetch<ServiceView[]>(endpoint('/services')),

  getService: (id: string): Promise<ServiceView> =>
    apiFetch<ServiceView>(endpoint(`/services/${id}`)),

  createService: (name: string, labels?: Labels): Promise<ServiceView> =>
    apiFetch<ServiceView>(endpoint('/services'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, labels }),
    }),

  deleteService: (id: string): Promise<void> =>
    apiFetch<void>(endpoint(`/services/${id}`), { method: 'DELETE' }),

  getServiceVersions: (id: string): Promise<ServiceVersionsResponse> =>
    apiFetch<ServiceVersionsResponse>(endpoint(`/services/${id}/versions`)),

  getServiceOpenApi: (id: string, version?: string): Promise<OpenApiDoc> => {
    const qs = version ? `?version=${encodeURIComponent(version)}` : ''
    return apiFetch<OpenApiDoc>(endpoint(`/services/${id}/openapi${qs}`))
  },

  registerInstance: (input: {
    serviceId:   string
    host:        string
    port:        number
    healthPath?: string
    metadata?:   Record<string, string>
  }): Promise<InstanceView> =>
    apiFetch<InstanceView>(endpoint('/instances'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),

  deregisterInstance: (id: string): Promise<void> =>
    apiFetch<void>(endpoint(`/instances/${id}`), { method: 'DELETE' }),
}
