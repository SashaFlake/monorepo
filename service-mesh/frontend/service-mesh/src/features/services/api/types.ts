// ── Services domain types ─────────────────────────────────────────────────────
// Единственный источник правды для типов домена services/instances/openapi.

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

export type MockManifest = {
  apiVersion: string
  kind:       string
  metadata: {
    name:        string
    version:     string
    generatedAt: string
  }
  spec: {
    exposure: string
    protocol: string
    ports:    Array<{ name: string; port: number; targetPort: number; protocol: string }>
    routing:  { loadBalancing: string; retries: number; timeoutMs: number }
    health:   { path: string; intervalMs: number; ttlMs: number }
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
