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

export const makeRoutingRuleHandlers = (service: RoutingRuleService) => ({

  list: async (
    req: FastifyRequest<{ Params: ServiceIdParams }>,
    reply: FastifyReply,
  ) => {
    const params = ServiceIdParam.safeParse(req.params)
    if (!params.success)
      return reply.status(400).send({ error: 'VALIDATION_ERROR', issues: params.error.issues })

    return reply.send(service.list(params.data.serviceId))
  },

  create: async (
    req: FastifyRequest<{ Params: ServiceIdParams; Body: CreateBodyType }>,
    reply: FastifyReply,
  ) => {
    const params = ServiceIdParam.safeParse(req.params)
    const body   = CreateBody.safeParse(req.body)
    if (!params.success || !body.success)
      return reply.status(400).send({ error: 'VALIDATION_ERROR' })

    return reply.status(201).send(
      service.create(params.data.serviceId, { ...body.data, serviceId: params.data.serviceId }),
    )
  },

  update: async (
    req: FastifyRequest<{ Params: RuleIdParams; Body: UpdateBodyType }>,
    reply: FastifyReply,
  ) => {
    const params = RuleIdParam.safeParse(req.params)
    const body   = UpdateBody.safeParse(req.body)
    if (!params.success || !body.success)
      return reply.status(400).send({ error: 'VALIDATION_ERROR' })

    return reply.send(service.update(params.data.ruleId, body.data))
  },

  delete: async (
    req: FastifyRequest<{ Params: RuleIdParams }>,
    reply: FastifyReply,
  ) => {
    const params = RuleIdParam.safeParse(req.params)
    if (!params.success)
      return reply.status(400).send({ error: 'VALIDATION_ERROR', issues: params.error.issues })

    service.delete(params.data.ruleId)
    return reply.status(204).send()
  },

})

export type RoutingRuleHandlers = ReturnType<typeof makeRoutingRuleHandlers>
