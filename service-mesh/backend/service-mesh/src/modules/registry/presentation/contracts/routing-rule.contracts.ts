import { z } from 'zod'
import type { RouteContract } from './route-contract.js'

// ---------------------------------------------------------------------------
// Shared schemas
// ---------------------------------------------------------------------------

export const RoutingRuleSchemas = {
  ServiceIdParam: z.object({
    serviceId: z.string().uuid(),
  }),

  RuleIdParam: z.object({
    ruleId: z.string().uuid(),
  }),

  /**
   * Weight-based canary: 90% traffic to v1, 10% to v2
   * Header-based: if x-canary=true → v2
   */
  CreateBody: z.object({
    priority:    z.number().int().min(0).default(0),
    match: z.object({
      headers: z.record(z.string()).optional(),
      labels:  z.record(z.string()).optional(),
    }).optional(),
    destination: z.object({
      version: z.string().optional(),
      labels:  z.record(z.string()).optional(),
      weight:  z.number().int().min(0).max(100).optional(),
    }),
  }),

  UpdateBody: z.object({
    priority:    z.number().int().min(0).optional(),
    match: z.object({
      headers: z.record(z.string()).optional(),
      labels:  z.record(z.string()).optional(),
    }).optional(),
    destination: z.object({
      version: z.string().optional(),
      labels:  z.record(z.string()).optional(),
      weight:  z.number().int().min(0).max(100).optional(),
    }).optional(),
  }),

  RuleDto: z.object({
    id:          z.string().uuid(),
    serviceId:   z.string().uuid(),
    priority:    z.number().int(),
    match:       z.any().nullable(),
    destination: z.any(),
    createdAt:   z.string().datetime(),
    updatedAt:   z.string().datetime(),
  }),
} as const

export type CreateRoutingRuleBody = z.infer<typeof RoutingRuleSchemas.CreateBody>
export type UpdateRoutingRuleBody = z.infer<typeof RoutingRuleSchemas.UpdateBody>
export type RuleIdParam           = z.infer<typeof RoutingRuleSchemas.RuleIdParam>
export type ServiceIdParam        = z.infer<typeof RoutingRuleSchemas.ServiceIdParam>

// ---------------------------------------------------------------------------
// Named contracts
// ---------------------------------------------------------------------------

export const ListRoutingRulesContract = {
  method:   'GET',
  path:     '/services/:serviceId/routing-rules',
  summary:  'List all routing rules for a service, ordered by priority',
  tags:     ['Routing Rules'],
  params:   RoutingRuleSchemas.ServiceIdParam,
  response: z.array(RoutingRuleSchemas.RuleDto),
} satisfies RouteContract

export const CreateRoutingRuleContract = {
  method:   'POST',
  path:     '/services/:serviceId/routing-rules',
  summary:  'Create a routing rule for a service',
  tags:     ['Routing Rules'],
  params:   RoutingRuleSchemas.ServiceIdParam,
  body:     RoutingRuleSchemas.CreateBody,
  response: RoutingRuleSchemas.RuleDto,
} satisfies RouteContract

export const UpdateRoutingRuleContract = {
  method:   'PUT',
  path:     '/routing-rules/:ruleId',
  summary:  'Update a routing rule',
  tags:     ['Routing Rules'],
  params:   RoutingRuleSchemas.RuleIdParam,
  body:     RoutingRuleSchemas.UpdateBody,
  response: RoutingRuleSchemas.RuleDto,
} satisfies RouteContract

export const DeleteRoutingRuleContract = {
  method:   'DELETE',
  path:     '/routing-rules/:ruleId',
  summary:  'Delete a routing rule',
  tags:     ['Routing Rules'],
  params:   RoutingRuleSchemas.RuleIdParam,
  response: z.void(),
} satisfies RouteContract
