import type { FastifyRequest, FastifyReply } from 'fastify'
import type { RegistryService } from '../../application/registry.service.js'
import {
  RoutingRuleSchemas,
  type CreateRoutingRuleBody,
  type UpdateRoutingRuleBody,
  type RuleIdParam,
  type ServiceIdParam,
} from '../contracts/routing-rule.contracts.js'

export const makeRoutingRuleHandlers = (registry: RegistryService) => ({

  list: async (
    req: FastifyRequest<{ Params: ServiceIdParam }>,
    reply: FastifyReply,
  ) => {
    const params = RoutingRuleSchemas.ServiceIdParam.safeParse(req.params)
    if (!params.success)
      return reply.status(400).send({ error: 'VALIDATION_ERROR' })

    // TODO: implement registry.listRoutingRules(serviceId)
    return reply.send([])
  },

  create: async (
    req: FastifyRequest<{ Params: ServiceIdParam; Body: CreateRoutingRuleBody }>,
    reply: FastifyReply,
  ) => {
    const params = RoutingRuleSchemas.ServiceIdParam.safeParse(req.params)
    if (!params.success)
      return reply.status(400).send({ error: 'VALIDATION_ERROR' })

    const body = RoutingRuleSchemas.CreateBody.safeParse(req.body)
    if (!body.success)
      return reply.status(400).send({ error: 'VALIDATION_ERROR', issues: body.error.issues })

    // TODO: implement registry.createRoutingRule(serviceId, body)
    return reply.status(201).send({ id: 'todo', serviceId: params.data.serviceId, ...body.data })
  },

  update: async (
    req: FastifyRequest<{ Params: RuleIdParam; Body: UpdateRoutingRuleBody }>,
    reply: FastifyReply,
  ) => {
    const params = RoutingRuleSchemas.RuleIdParam.safeParse(req.params)
    if (!params.success)
      return reply.status(400).send({ error: 'VALIDATION_ERROR' })

    const body = RoutingRuleSchemas.UpdateBody.safeParse(req.body)
    if (!body.success)
      return reply.status(400).send({ error: 'VALIDATION_ERROR', issues: body.error.issues })

    // TODO: implement registry.updateRoutingRule(ruleId, body)
    return reply.send({ id: params.data.ruleId, ...body.data })
  },

  delete: async (
    req: FastifyRequest<{ Params: RuleIdParam }>,
    reply: FastifyReply,
  ) => {
    const params = RoutingRuleSchemas.RuleIdParam.safeParse(req.params)
    if (!params.success)
      return reply.status(400).send({ error: 'VALIDATION_ERROR' })

    // TODO: implement registry.deleteRoutingRule(ruleId)
    return reply.status(204).send()
  },
})

export type RoutingRuleHandlers = ReturnType<typeof makeRoutingRuleHandlers>
