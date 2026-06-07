import { Schema } from 'effect'

export const RoutingRuleSchema = Schema.Struct({
  id:           Schema.String,
  serviceId:    Schema.String,
  name:         Schema.String,
  priority:     Schema.Number,
  match:        Schema.Struct({
    pathPrefix: Schema.optional(Schema.String),
    headers:    Schema.optional(Schema.Record({ key: Schema.String, value: Schema.String })),
  }),
  destinations: Schema.Array(Schema.Struct({
    id:         Schema.String,
    serviceId:  Schema.optional(Schema.String),
    version:    Schema.String,
    weightPct:  Schema.Number,
  })),
  createdAt: Schema.String,
  updatedAt: Schema.String,
})
