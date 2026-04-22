// ---------------------------------------------------------------------------
// Registry API client
// Все типы зеркалят backend/service-mesh domain/model.ts
// ---------------------------------------------------------------------------

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export type InstanceStatus = 'passing' | 'warning' | 'critical'

export type ServiceInstance = {
  id:              string
  serviceName:     string
  host:            string
  port:            number
  metadata:        Record<string, string>
  registeredAt:    string
  lastHeartbeatAt: string
  status:          InstanceStatus
}

// GET /api/v1/services
// { [serviceName]: ServiceInstance[] }
export type ServicesMap = Record<string, ServiceInstance[]>

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export const registryApi = {
  listServices: (): Promise<ServicesMap> =>
    get<ServicesMap>('/api/v1/services'),

  getService: (name: string): Promise<ServiceInstance[]> =>
    get<ServiceInstance[]>(`/api/v1/services/${name}`),
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------
export const registryKeys = {
  all:     ['registry'] as const,
  list:    () => [...registryKeys.all, 'list'] as const,
  service: (name: string) => [...registryKeys.all, 'service', name] as const,
}
