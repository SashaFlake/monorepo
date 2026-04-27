import { z } from 'zod'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { RoutingRuleService } from '../../application/routing-rule.service.js'
import {
  ServiceIdParam,
  RuleIdParam,
  CreateBody,
  UpdateBody,
} from '../contracts/routing-rule.contracts.js'

type ServiceIdParams = z.infer<typeof ServiceIdParam>
type RuleIdParams    = z.infer<typeof RuleIdParam>
type CreateBodyType  = z.infer<typeof CreateBody>
type UpdateBodyType  = z.infer<typeof UpdateBody>

/**
 * Handlers receive already-validated data — Fastify validates via JSON Schema
 * registered in routes.ts (derived from EndpointContracts).
 */
export const makeRoutingRuleHandlers = (routingRulesService: RoutingRuleService) => ({

  list: async (
    req: FastifyRequest<{ Params: ServiceIdParams }>,
    reply: FastifyReply,
  ) => {
    return reply.send(routingRulesService.list(req.params.serviceId))
  },

  create: async (
    req: FastifyRequest<{ Params: ServiceIdParams; Body: CreateBodyType }>,
    reply: FastifyReply,
  ) => {
    return reply.status(201).send(
      routingRulesService.create(req.params.serviceId, { ...req.body, serviceId: req.params.serviceId }),
    )
  },

  update: async (
    req: FastifyRequest<{ Params: RuleIdParams; Body: UpdateBodyType }>,
    reply: FastifyReply,
  ) => {
    return reply.send(routingRulesService.update(req.params.ruleId, req.body))
  },

  delete: async (
    req: FastifyRequest<{ Params: RuleIdParams }>,
    reply: FastifyReply,
  ) => {
    routingRulesService.delete(req.params.ruleId)
    return reply.status(204).send()
  },

})

export type RoutingRuleHandlers = ReturnType<typeof makeRoutingRuleHandlers>
