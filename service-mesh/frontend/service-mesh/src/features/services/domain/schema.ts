import { Schema } from 'effect'

export const InstanceViewSchema = Schema.Struct({
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
})

export const ServiceViewSchema = Schema.Struct({
  id:           Schema.String,
  name:         Schema.String,
  labels:       Schema.Record({ key: Schema.String, value: Schema.String }),
  registeredAt: Schema.String,
  instances:    Schema.Array(InstanceViewSchema),
  worstStatus:  Schema.Literal('passing', 'warning', 'critical'),
})

export const ServiceVersionsResponseSchema = Schema.Struct({
  serviceId:   Schema.String,
  serviceName: Schema.String,
  versions:    Schema.Array(Schema.Struct({
    version:       Schema.String,
    instanceCount: Schema.Number,
    instances:     Schema.Array(InstanceViewSchema),
    manifest:      Schema.Unknown,
  })),
})

export const OpenApiOperationSchema = Schema.Struct({
  summary:     Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  operationId: Schema.optional(Schema.String),
  tags:        Schema.optional(Schema.Array(Schema.String)),
  deprecated:  Schema.optional(Schema.Boolean),
})

export const OpenApiDocSchema = Schema.Struct({
  openapi: Schema.optional(Schema.String),
  info: Schema.optional(Schema.Struct({
    title: Schema.optional(Schema.String),
    version: Schema.optional(Schema.String),
    description: Schema.optional(Schema.String),
  })),
  paths: Schema.optional(Schema.Record({
    key: Schema.String,
    value: Schema.Record({
      key: Schema.String,
      value: Schema.Struct({
        summary:     Schema.optional(Schema.String),
        description: Schema.optional(Schema.String),
        operationId: Schema.optional(Schema.String),
        tags:        Schema.optional(Schema.Array(Schema.String)),
        deprecated:  Schema.optional(Schema.Boolean),
      }),
    }),
  })),
  tags: Schema.optional(Schema.Array(Schema.Struct({
    name:        Schema.String,
    description: Schema.optional(Schema.String),
  }))),
})
