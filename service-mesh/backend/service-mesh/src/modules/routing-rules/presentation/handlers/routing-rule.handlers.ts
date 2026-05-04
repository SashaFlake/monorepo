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
 * HTTP status code mapping for routing rule errors.
 */
const getStatusCode = (errorCode: string): number => {
  switch (errorCode) {
    case 'RULE_NOT_FOUND': return 404
    case 'SERVICE_NOT_FOUND': return 404
    case 'VALIDATION_ERROR': return 400
    default: return 500
  }
}

/**
 * Handlers receive already-validated data — Fastify validates via JSON Schema
 * registered in routes.ts (derived from EndpointContracts).
 * Handlers process Result<T, E> types from service layer.
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
    const result = routingRulesService.create(req.params.serviceId, { ...req.body, serviceId: req.params.serviceId })

    if (result.isErr()) {
      const error = result.error
      return reply.status(getStatusCode(error.code)).send({ error: error.code, message: error.message })
    }

    return reply.status(201).send(result.value)
  },

  update: async (
    req: FastifyRequest<{ Params: RuleIdParams; Body: UpdateBodyType }>,
    reply: FastifyReply,
  ) => {
    const result = routingRulesService.update(req.params.ruleId, req.body)

    if (result.isErr()) {
      const error = result.error
      return reply.status(getStatusCode(error.code)).send({ error: error.code, message: error.message })
    }

    return reply.send(result.value)
  },

  delete: async (
    req: FastifyRequest<{ Params: RuleIdParams }>,
    reply: FastifyReply,
  ) => {
    const result = routingRulesService.delete(req.params.ruleId)

    if (result.isErr()) {
      const error = result.error
      return reply.status(getStatusCode(error.code)).send({ error: error.code, message: error.message })
    }

    return reply.status(204).send()
  },

})

export type RoutingRuleHandlers = ReturnType<typeof makeRoutingRuleHandlers>
