import { z } from 'zod'
import type { EndpointContract } from '../../../../shared/endpoint-contract.js'

// ── Shared sub-schemas ────────────────────────────────────────────────────────

const Match = z.object({
  headers:    z.record(z.string()).optional(),
  pathPrefix: z.string().optional(),
})

const Destination = z.object({
  version:   z.string().optional(),
  weightPct: z.number().int().min(0).max(100),
})

const Destinations = z
  .array(Destination)
  .min(1, 'Нужен хотя бы один destination')
  .refine(
    arr => arr.reduce((s, d) => s + d.weightPct, 0) === 100,
    { message: 'Сумма weightPct всех destinations должна быть равна 100' },
  )

// ── Params ────────────────────────────────────────────────────────────────────

export const ServiceIdParam = z.object({ serviceId: z.string().uuid() })
export const RuleIdParam    = z.object({ ruleId:    z.string().uuid() })

// ── Request bodies ────────────────────────────────────────────────────────────

export const CreateBody = z.object({
  name:         z.string().min(1).max(128),
  priority:     z.number().int().min(0).max(1000),
  match:        Match,
  destinations: Destinations,
})

export const UpdateBody = z.object({
  name:         z.string().min(1).max(128).optional(),
  priority:     z.number().int().min(0).max(1000).optional(),
  match:        Match.optional(),
  destinations: Destinations.optional(),
})

// ── Response DTO ──────────────────────────────────────────────────────────────

export const RoutingRuleDto = z.object({
  id:           z.string().uuid(),
  serviceId:    z.string().uuid(),
  name:         z.string(),
  priority:     z.number().int(),
  match:        Match,
  destinations: z.array(Destination),
  createdAt:    z.string().datetime(),
  updatedAt:    z.string().datetime(),
})

// ── Endpoint contracts ────────────────────────────────────────────────────────

export const ListRulesContract = {
  method:   'GET',
  path:     '/services/:serviceId/routing-rules',
  summary:  'List routing rules for a service',
  tags:     ['routing-rules'],
  params:   ServiceIdParam,
  response: z.array(RoutingRuleDto),
} as const satisfies EndpointContract

export const CreateRuleContract = {
  method:   'POST',
  path:     '/services/:serviceId/routing-rules',
  summary:  'Create a routing rule',
  tags:     ['routing-rules'],
  params:   ServiceIdParam,
  body:     CreateBody,
  response: RoutingRuleDto,
} as const satisfies EndpointContract

export const UpdateRuleContract = {
  method:   'PUT',
  path:     '/routing-rules/:ruleId',
  summary:  'Update a routing rule',
  tags:     ['routing-rules'],
  params:   RuleIdParam,
  body:     UpdateBody,
  response: RoutingRuleDto,
} as const satisfies EndpointContract

export const DeleteRuleContract = {
  method:   'DELETE',
  path:     '/routing-rules/:ruleId',
  summary:  'Delete a routing rule',
  tags:     ['routing-rules'],
  params:   RuleIdParam,
  response: z.void(),
} as const satisfies EndpointContract
