import { Schema } from 'effect'

/**
 * Effect schema for {@link InstanceView}.
 *
 * Validates the flat instance view returned by the registry backend.
 */
export const InstanceViewSchema = Schema.mutable(Schema.Struct({
  id:              Schema.String,
  serviceId:       Schema.String,
  host:            Schema.String,
  port:            Schema.Number,
  healthPath:      Schema.String,
  metadata:        Schema.Record({ key: Schema.String, value: Schema.String }),
  registeredAt:    Schema.String,
  lastHeartbeatAt: Schema.String,
  lastHealthCheck: Schema.NullOr(Schema.Struct({
    checkedAt:  Schema.String,
    ok:         Schema.Boolean,
    statusCode: Schema.NullOr(Schema.Number),
    latencyMs:  Schema.Number,
  })),
  status: Schema.Literal('passing', 'warning', 'critical'),
}))

/**
 * Effect schema for {@link ServiceView}.
 */
export const ServiceViewSchema = Schema.mutable(Schema.Struct({
  id:           Schema.String,
  name:         Schema.String,
  labels:       Schema.Record({ key: Schema.String, value: Schema.String }),
  registeredAt: Schema.String,
  instances:    Schema.mutable(Schema.Array(InstanceViewSchema)),
  worstStatus:  Schema.Literal('passing', 'warning', 'critical'),
}))

/**
 * Effect schema for {@link MockManifest}.
 */
export const MockManifestSchema = Schema.mutable(Schema.Struct({
  apiVersion: Schema.String,
  kind:       Schema.String,
  metadata: Schema.mutable(Schema.Struct({
    name:        Schema.String,
    version:     Schema.String,
    generatedAt: Schema.String,
  })),
  spec: Schema.mutable(Schema.Struct({
    exposure: Schema.String,
    protocol: Schema.String,
    ports:    Schema.mutable(Schema.Array(Schema.mutable(Schema.Struct({
      name:       Schema.String,
      port:       Schema.Number,
      targetPort: Schema.Number,
      protocol:   Schema.String,
    })))),
    routing: Schema.mutable(Schema.Struct({
      loadBalancing: Schema.String,
      retries:       Schema.Number,
      timeoutMs:     Schema.Number,
    })),
    health: Schema.mutable(Schema.Struct({
      path:       Schema.String,
      intervalMs: Schema.Number,
      ttlMs:      Schema.Number,
    })),
  })),
}))

/**
 * Effect schema for {@link ServiceVersionsResponse}.
 *
 * Note: `manifest` is typed as `MockManifestSchema` because the mock data-plane
 * may evolve its manifest shape independently of the UI schema.
 */
export const ServiceVersionsResponseSchema = Schema.mutable(Schema.Struct({
  serviceId:   Schema.String,
  serviceName: Schema.String,
  versions:    Schema.mutable(Schema.Array(Schema.mutable(Schema.Struct({
    version:       Schema.String,
    instanceCount: Schema.Number,
    instances:     Schema.mutable(Schema.Array(InstanceViewSchema)),
    manifest:      MockManifestSchema,
  })))),
}))

/**
 * Effect schema for a single OpenAPI operation.
 *
 * Captures the fields the UI renders (summary, tags, deprecation); unknown
 * fields are ignored.
 */
export const OpenApiOperationSchema = Schema.mutable(Schema.Struct({
  summary:     Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  operationId: Schema.optional(Schema.String),
  tags:        Schema.optional(Schema.mutable(Schema.Array(Schema.String))),
  deprecated:  Schema.optional(Schema.Boolean),
}))

/**
 * Effect schema for {@link OpenApiDoc}.
 *
 * Keeps most fields optional because the document is produced by arbitrary
 * services and may be partial.
 */
export const OpenApiDocSchema = Schema.mutable(Schema.Struct({
  openapi: Schema.optional(Schema.String),
  info: Schema.optional(Schema.mutable(Schema.Struct({
    title: Schema.optional(Schema.String),
    version: Schema.optional(Schema.String),
    description: Schema.optional(Schema.String),
  }))),
  paths: Schema.optional(Schema.mutable(Schema.Record({
    key: Schema.String,
    value: Schema.mutable(Schema.Record({
      key: Schema.String,
      value: Schema.mutable(Schema.Struct({
        summary:     Schema.optional(Schema.String),
        description: Schema.optional(Schema.String),
        operationId: Schema.optional(Schema.String),
        tags:        Schema.optional(Schema.mutable(Schema.Array(Schema.String))),
        deprecated:  Schema.optional(Schema.Boolean),
      })),
    })),
  }))),
  tags: Schema.optional(Schema.mutable(Schema.Array(Schema.mutable(Schema.Struct({
    name:        Schema.String,
    description: Schema.optional(Schema.String),
  }))))),
}))
