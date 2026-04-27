// ---------------------------------------------------------------------------
// Registry API client
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

// ---------------------------------------------------------------------------
// Versions & Manifest
// ---------------------------------------------------------------------------

export type MockManifest = {
  apiVersion: string
  kind: string
  metadata: {
    name: string
    version: string
    generatedAt: string
  }
  spec: {
    exposure: string
    protocol: string
    ports: Array<{ name: string; port: number; targetPort: number; protocol: string }>
    routing: { loadBalancing: string; retries: number; timeoutMs: number }
    health: { path: string; intervalMs: number; ttlMs: number }
  }
}

export type ServiceVersion = {
  version:       string
  instanceCount: number
  instances:     InstanceView[]
  manifest:      MockManifest
}

export type ServiceVersionsResponse = {
  serviceId:   string
  serviceName: string
  versions:    ServiceVersion[]
}

// OpenAPI — минимальный тип для отображения
export type OpenApiDoc = {
  openapi?: string
  info?: { title?: string; version?: string; description?: string }
  paths?: Record<string, Record<string, {
    summary?:     string
    description?: string
    operationId?: string
    tags?:        string[]
    parameters?:  unknown[]
    responses?:   Record<string, unknown>
    deprecated?:  boolean
  }>>
  tags?: Array<{ name: string; description?: string }>
}

export type OpenApiError = {
  error:   string
  message: string
  url?:    string
}

// ---------------------------------------------------------------------------
// Routing Rules
// ---------------------------------------------------------------------------

export type RoutingRuleDestination = {
  serviceId: string
  weightPct: number
}

export type RoutingRule = {
  id:            string
  name:          string
  sourceService: string
  destinations:  RoutingRuleDestination[]
  createdAt:     string
  updatedAt:     string
}

export type CreateRoutingRuleInput = {
  name:          string
  sourceService: string
  destinations:  RoutingRuleDestination[]
}

// ---------------------------------------------------------------------------
// Fetch helper
// ---------------------------------------------------------------------------

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

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

  // Versions & manifest
  getServiceVersions: (id: string): Promise<ServiceVersionsResponse> =>
    apiFetch<ServiceVersionsResponse>(`/api/v1/services/${id}/versions`),

  // OpenAPI (может вернуть 502/503 — обрабатываем в компоненте)
  getServiceOpenApi: (id: string, version?: string): Promise<OpenApiDoc> => {
    const qs = version ? `?version=${encodeURIComponent(version)}` : ''
    return apiFetch<OpenApiDoc>(`/api/v1/services/${id}/openapi${qs}`)
  },

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

  // Routing rules
  listRoutingRules: (): Promise<RoutingRule[]> =>
    apiFetch<RoutingRule[]>('/api/v1/routing-rules'),

  getRoutingRule: (id: string): Promise<RoutingRule> =>
    apiFetch<RoutingRule>(`/api/v1/routing-rules/${id}`),

  createRoutingRule: (input: CreateRoutingRuleInput): Promise<RoutingRule> =>
    apiFetch<RoutingRule>('/api/v1/routing-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),

  deleteRoutingRule: (id: string): Promise<void> =>
    apiFetch<void>(`/api/v1/routing-rules/${id}`, { method: 'DELETE' }),
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------
export const registryKeys = {
  all:          ['registry'] as const,
  list:         () => [...registryKeys.all, 'list'] as const,
  service:      (id: string) => [...registryKeys.all, 'service', id] as const,
  versions:     (id: string) => [...registryKeys.all, 'versions', id] as const,
  openapi:      (id: string, version?: string) => [...registryKeys.all, 'openapi', id, version ?? ''] as const,
  routingRules: () => [...registryKeys.all, 'routing-rules'] as const,
  routingRule:  (id: string) => [...registryKeys.all, 'routing-rules', id] as const,
}
