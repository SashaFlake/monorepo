import type { FastifyRequest, FastifyReply } from 'fastify'
import type { RoutingRuleService } from '../application/routing-rule.service.js'
import {
  ServiceIdParam,
  RuleIdParam,
  CreateRoutingRuleBody,
  UpdateRoutingRuleBody,
} from './routing-rule.contracts.js'

export const makeRoutingRuleHandlers = (service: RoutingRuleService) => ({

  list: async (
    req: FastifyRequest<{ Params: ServiceIdParam }>,
    reply: FastifyReply,
  ) => {
    const params = ServiceIdParam.safeParse(req.params)
    if (!params.success)
      return reply.status(400).send({ error: 'VALIDATION_ERROR', issues: params.error.issues })

    return reply.send(service.list(params.data.serviceId))
  },

  create: async (
    req: FastifyRequest<{ Params: ServiceIdParam; Body: CreateRoutingRuleBody }>,
    reply: FastifyReply,
  ) => {
    const params = ServiceIdParam.safeParse(req.params)
    const body   = CreateRoutingRuleBody.safeParse(req.body)
    if (!params.success || !body.success)
      return reply.status(400).send({ error: 'VALIDATION_ERROR' })

    return reply.status(201).send(
      service.create(params.data.serviceId, { ...body.data, serviceId: params.data.serviceId }),
    )
  },

  update: async (
    req: FastifyRequest<{ Params: RuleIdParam; Body: UpdateRoutingRuleBody }>,
    reply: FastifyReply,
  ) => {
    const params = RuleIdParam.safeParse(req.params)
    const body   = UpdateRoutingRuleBody.safeParse(req.body)
    if (!params.success || !body.success)
      return reply.status(400).send({ error: 'VALIDATION_ERROR' })

    return reply.send(service.update(params.data.ruleId, body.data))
  },

  delete: async (
    req: FastifyRequest<{ Params: RuleIdParam }>,
    reply: FastifyReply,
  ) => {
    const params = RuleIdParam.safeParse(req.params)
    if (!params.success)
      return reply.status(400).send({ error: 'VALIDATION_ERROR', issues: params.error.issues })

    service.delete(params.data.ruleId)
    return reply.status(204).send()
  },

})
