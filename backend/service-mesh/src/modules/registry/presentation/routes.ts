import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import type { RegistryService } from '../application/registry.service.js'

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const RegisterBody = z.object({
  serviceName: z.string().min(1).max(128),
  host:        z.string().min(1),
  port:        z.number().int().min(1).max(65535),
  metadata:    z.record(z.string()).optional(),
})

const HeartbeatParams = z.object({
  instanceId: z.string().uuid(),
})

const DeregisterParams = z.object({
  instanceId: z.string().uuid(),
})

const GetServiceParams = z.object({
  name: z.string().min(1),
})

// ---------------------------------------------------------------------------
// Route plugin
// ---------------------------------------------------------------------------

type Opts = { registry: RegistryService }

export const registryRoutes: FastifyPluginAsync<Opts> = async (app, { registry }) => {

  // POST /services — зарегистрировать инстанс
  app.post('/services', async (req, reply) => {
    const parsed = RegisterBody.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
    }

    const result = registry.register(parsed.data)
    if (result.isErr()) {
      return reply.status(400).send({ error: result.error.code, message: result.error.message })
    }

    return reply.status(201).send(result.value)
  })

  // PUT /instances/:instanceId/heartbeat — продлить TTL
  app.put('/instances/:instanceId/heartbeat', async (req, reply) => {
    const params = HeartbeatParams.safeParse(req.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'VALIDATION_ERROR' })
    }

    const result = registry.heartbeat(params.data.instanceId)
    if (result.isErr()) {
      return reply.status(404).send({ error: result.error.code, message: result.error.message })
    }

    return reply.status(204).send()
  })

  // DELETE /instances/:instanceId — дерегистрировать
  app.delete('/instances/:instanceId', async (req, reply) => {
    const params = DeregisterParams.safeParse(req.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'VALIDATION_ERROR' })
    }

    const result = registry.deregister(params.data.instanceId)
    if (result.isErr()) {
      return reply.status(404).send({ error: result.error.code, message: result.error.message })
    }

    return reply.status(204).send()
  })

  // GET /services — список всех сервисов
  app.get('/services', async (_req, reply) => {
    return reply.send(registry.listServices())
  })

  // GET /services/:name — инстансы конкретного сервиса
  app.get('/services/:name', async (req, reply) => {
    const params = GetServiceParams.safeParse(req.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'VALIDATION_ERROR' })
    }

    const result = registry.getService(params.data.name)
    if (result.isErr()) {
      return reply.status(404).send({ error: result.error.code, message: result.error.message })
    }

    return reply.send(result.value)
  })
}
