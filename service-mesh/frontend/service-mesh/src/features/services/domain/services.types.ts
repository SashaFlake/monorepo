// ── Services domain types ─────────────────────────────────────────────────────
// Единственный источник правды для типов домена services/instances/openapi.

/**
 * Derived health state of a single service instance.
 *
 * Computed by the backend from heartbeat TTL and the latest health check.
 */
export type InstanceStatus = 'passing' | 'warning' | 'critical'

/**
 * Free-form key/value labels attached to a service.
 */
export type Labels = Record<string, string>

/**
 * Flat view of a registered service instance returned by the backend.
 *
 * Includes identity, network coordinates, metadata, and the latest known
 * health snapshot.
 */
export type InstanceView = {
  /** Instance identifier assigned on registration. */
  id:              string

  /** Parent service identifier. */
  serviceId:       string

  /** Host address advertised by the instance. */
  host:            string

  /** Port advertised by the instance. */
  port:            number

  /** Relative path the control plane should probe for health checks. */
  healthPath:      string

  /** Opaque metadata dictionary supplied at registration. */
  metadata:        Record<string, string>

  /** ISO-8601 timestamp of when the instance was registered. */
  registeredAt:    string

  /** ISO-8601 timestamp of the most recent heartbeat. */
  lastHeartbeatAt: string

  /** Result of the last explicit health check, or `null` if none ran yet. */
  lastHealthCheck: {
    checkedAt:  string
    ok:         boolean
    statusCode: number | null
    latencyMs:  number
  } | null

  /** Derived aggregate status for display purposes. */
  status: InstanceStatus
}

/**
 * Flat view of a registered service returned by the backend.
 *
 * The aggregate `worstStatus` reflects the most severe status among the
 * service's instances.
 */
export type ServiceView = {
  /** Service identifier. */
  id:           string

  /** Human-readable service name. */
  name:         string

  /** Labels attached to the service. */
  labels:       Labels

  /** ISO-8601 timestamp of when the service was created. */
  registeredAt: string

  /** Current instance list for the service. */
  instances:    InstanceView[]

  /** Most severe status across all instances. */
  worstStatus:  InstanceStatus
}

/**
 * Mock manifest describing how a service version expects to be exposed.
 *
 * This shape is produced by the mock data-plane node and consumed by the
 * admin UI for the service detail page.
 */
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

/**
 * A homogeneous group of instances running the same version of a service.
 */
export type ServiceVersion = {
  /** Version string (e.g. `v1.2.0`). */
  version:       string

  /** Number of instances in this version group. */
  instanceCount: number

  /** Instances belonging to this version. */
  instances:     InstanceView[]

  /** Manifest describing the version's exposure and health configuration. */
  manifest:      MockManifest
}

/**
 * Response body for the service versions endpoint.
 */
export type ServiceVersionsResponse = {
  /** Service identifier. */
  serviceId:   string

  /** Human-readable service name. */
  serviceName: string

  /** Version groups returned for the service. */
  versions:    ServiceVersion[]
}

/**
 * OpenAPI document exposed by a service version.
 *
 * Intentionally permissive: the document is produced by arbitrary services,
 * so most fields are optional and paths are loosely typed.
 */
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

/**
 * Error shape returned when the OpenAPI endpoint cannot produce a document.
 */
export type OpenApiError = {
  error:   string
  message: string
  url?:    string
}
