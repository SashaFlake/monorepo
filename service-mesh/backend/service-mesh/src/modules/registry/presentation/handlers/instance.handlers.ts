import type { FastifyRequest, FastifyReply } from 'fastify'
import type { RegistryService } from '../../application/registry.service.js'
import {
  InstanceSchemas,
  type RegisterInstanceBody,
  type InstanceIdParam,
} from '../contracts/instance.contracts.js'

export const makeInstanceHandlers = (registry: RegistryService) => ({

  register: async (
    req: FastifyRequest<{ Body: RegisterInstanceBody }>,
    reply: FastifyReply,
  ) => {
    const parsed = InstanceSchemas.RegisterBody.safeParse(req.body)
    if (!parsed.success)
      return reply.status(400).send({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })

    const result = registry.registerInstance(parsed.data)
    if (result.isErr())
      return reply.status(404).send({ error: result.error.code, message: result.error.message })

    return reply.status(201).send(result.value)
  },

  heartbeat: async (
    req: FastifyRequest<{ Params: InstanceIdParam }>,
    reply: FastifyReply,
  ) => {
    const params = InstanceSchemas.InstanceIdParam.safeParse(req.params)
    if (!params.success)
      return reply.status(400).send({ error: 'VALIDATION_ERROR' })

    const result = registry.heartbeat(params.data.instanceId)
    if (result.isErr())
      return reply.status(404).send({ error: result.error.code, message: result.error.message })

    return reply.status(204).send()
  },

  deregister: async (
    req: FastifyRequest<{ Params: InstanceIdParam }>,
    reply: FastifyReply,
  ) => {
    const params = InstanceSchemas.InstanceIdParam.safeParse(req.params)
    if (!params.success)
      return reply.status(400).send({ error: 'VALIDATION_ERROR' })

    const result = registry.deregisterInstance(params.data.instanceId)
    if (result.isErr())
      return reply.status(404).send({ error: result.error.code, message: result.error.message })

    return reply.status(204).send()
  },
})

export type InstanceHandlers = ReturnType<typeof makeInstanceHandlers>
