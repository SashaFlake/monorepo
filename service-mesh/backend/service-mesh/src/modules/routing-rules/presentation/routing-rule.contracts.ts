import { z } from 'zod'

const Match = z.object({
  headers:    z.record(z.string()).optional(),
  pathPrefix: z.string().optional(),
})

const Destination = z.object({
  version:   z.string().optional(),
  weightPct: z.number().int().min(0).max(100),
})

export const ServiceIdParam = z.object({ serviceId: z.string().uuid() })
export const RuleIdParam    = z.object({ ruleId:    z.string().uuid() })

export const CreateBody = z.object({
  name:        z.string().min(1).max(128),
  priority:    z.number().int().min(0).max(1000),
  match:       Match,
  destination: Destination,
})

export const UpdateBody = CreateBody.partial()

export const RoutingRuleDto = z.object({
  id:          z.string().uuid(),
  serviceId:   z.string().uuid(),
  name:        z.string(),
  priority:    z.number().int(),
  match:       Match,
  destination: Destination,
  createdAt:   z.string().datetime(),
  updatedAt:   z.string().datetime(),
})