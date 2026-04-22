// ---------------------------------------------------------------------------
// Registry API client
// Типы зеркалят backend domain/model.ts
// ---------------------------------------------------------------------------

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export type InstanceStatus = 'passing' | 'warning' | 'critical'
export type Labels = Record<string, string>

export type InstanceView = {
  id:              string
  serviceId:       string
  host:            string
  port:            number
  healthPath:      string
  metadata:        Record<string, string>
  registeredAt:    string
  lastHeartbeatAt: string
  lastHealthCheck: {
    checkedAt:  string
    ok:         boolean
    statusCode: number | null
    latencyMs:  number
  } | null
  status: InstanceStatus
}

export type ServiceView = {
  id:           string
  name:         string
  labels:       Labels
  registeredAt: string
  instances:    InstanceView[]
  worstStatus:  InstanceStatus
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export const registryApi = {
  // Services
  listServices: (): Promise<ServiceView[]> =>
    apiFetch<ServiceView[]>('/api/v1/services'),

  getService: (id: string): Promise<ServiceView> =>
    apiFetch<ServiceView>(`/api/v1/services/${id}`),

  createService: (name: string, labels?: Labels): Promise<ServiceView> =>
    apiFetch<ServiceView>('/api/v1/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, labels }),
    }),

  deleteService: (id: string): Promise<void> =>
    apiFetch<void>(`/api/v1/services/${id}`, { method: 'DELETE' }),

  // Instances
  registerInstance: (input: {
    serviceId: string
    host: string
    port: number
    healthPath?: string
    metadata?: Record<string, string>
  }): Promise<InstanceView> =>
    apiFetch<InstanceView>('/api/v1/instances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),

  deregisterInstance: (id: string): Promise<void> =>
    apiFetch<void>(`/api/v1/instances/${id}`, { method: 'DELETE' }),
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------
export const registryKeys = {
  all:     ['registry'] as const,
  list:    () => [...registryKeys.all, 'list'] as const,
  service: (id: string) => [...registryKeys.all, 'service', id] as const,
}
