import { z } from 'zod'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const RoutingRuleMatchSchema = z.object({
  headers:    z.record(z.string()).optional(),
  pathPrefix: z.string().optional(),
})

export const RoutingRuleDestinationSchema = z.object({
  version:   z.string().optional(),
  weightPct: z.number().int().min(0).max(100),
})

export const RoutingRuleDto = z.object({
  id:          z.string().uuid(),
  serviceId:   z.string().uuid(),
  name:        z.string(),
  priority:    z.number().int(),
  match:       RoutingRuleMatchSchema,
  destination: RoutingRuleDestinationSchema,
  createdAt:   z.string().datetime(),
  updatedAt:   z.string().datetime(),
})

export const ServiceIdParam = z.object({
  serviceId: z.string().uuid(),
})

export const RuleIdParam = z.object({
  ruleId: z.string().uuid(),
})

export const CreateRoutingRuleBody = z.object({
  name:        z.string().min(1).max(128),
  priority:    z.number().int().min(0).max(1000),
  match:       RoutingRuleMatchSchema,
  destination: RoutingRuleDestinationSchema,
})

export const UpdateRoutingRuleBody = z.object({
  name:        z.string().min(1).max(128).optional(),
  priority:    z.number().int().min(0).max(1000).optional(),
  match:       RoutingRuleMatchSchema.optional(),
  destination: RoutingRuleDestinationSchema.optional(),
})

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type RoutingRuleDto        = z.infer<typeof RoutingRuleDto>
export type ServiceIdParam        = z.infer<typeof ServiceIdParam>
export type RuleIdParam           = z.infer<typeof RuleIdParam>
export type CreateRoutingRuleBody = z.infer<typeof CreateRoutingRuleBody>
export type UpdateRoutingRuleBody = z.infer<typeof UpdateRoutingRuleBody>
