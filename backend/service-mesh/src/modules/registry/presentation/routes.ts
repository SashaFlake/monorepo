import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import type { RegistryService } from '../application/registry.service.js'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const CreateServiceBody = z.object({
  name:   z.string().min(1).max(128),
  labels: z.record(z.string()).optional(),
})

const RegisterInstanceBody = z.object({
  serviceId:  z.string().uuid(),
  host:       z.string().min(1),
  port:       z.number().int().min(1).max(65535),
  healthPath: z.string().startsWith('/').optional(),
  metadata:   z.record(z.string()).optional(),
})

const ServiceIdParam   = z.object({ serviceId:  z.string().uuid() })
const InstanceIdParam  = z.object({ instanceId: z.string().uuid() })

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

type Opts = { registry: RegistryService }

export const registryRoutes: FastifyPluginAsync<Opts> = async (app, { registry }) => {

  // ── Services ──────────────────────────────────────────────────────────────

  // POST /services — создать сервис
  app.post('/services', async (req, reply) => {
    const parsed = CreateServiceBody.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
    }
    const result = registry.createService(parsed.data)
    if (result.isErr()) return reply.status(400).send({ error: result.error.code, message: result.error.message })
    return reply.status(201).send(result.value)
  })

  // GET /services — список всех сервисов
  app.get('/services', async (_req, reply) => {
    return reply.send(registry.listServices())
  })

  // GET /services/:serviceId
  app.get('/services/:serviceId', async (req, reply) => {
    const params = ServiceIdParam.safeParse(req.params)
    if (!params.success) return reply.status(400).send({ error: 'VALIDATION_ERROR' })

    const result = registry.getService(params.data.serviceId)
    if (result.isErr()) return reply.status(404).send({ error: result.error.code, message: result.error.message })
    return reply.send(result.value)
  })

  // DELETE /services/:serviceId — вывести сервис из обращения (+ все его инстансы)
  app.delete('/services/:serviceId', async (req, reply) => {
    const params = ServiceIdParam.safeParse(req.params)
    if (!params.success) return reply.status(400).send({ error: 'VALIDATION_ERROR' })

    const result = registry.deleteService(params.data.serviceId)
    if (result.isErr()) return reply.status(404).send({ error: result.error.code, message: result.error.message })
    return reply.status(204).send()
  })

  // ── Instances ─────────────────────────────────────────────────────────────

  // POST /instances — зарегистрировать инстанс
  app.post('/instances', async (req, reply) => {
    const parsed = RegisterInstanceBody.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
    }
    const result = registry.registerInstance(parsed.data)
    if (result.isErr()) return reply.status(404).send({ error: result.error.code, message: result.error.message })
    return reply.status(201).send(result.value)
  })

  // PUT /instances/:instanceId/heartbeat
  app.put('/instances/:instanceId/heartbeat', async (req, reply) => {
    const params = InstanceIdParam.safeParse(req.params)
    if (!params.success) return reply.status(400).send({ error: 'VALIDATION_ERROR' })

    const result = registry.heartbeat(params.data.instanceId)
    if (result.isErr()) return reply.status(404).send({ error: result.error.code, message: result.error.message })
    return reply.status(204).send()
  })

  // DELETE /instances/:instanceId — дерегистрировать инстанс
  app.delete('/instances/:instanceId', async (req, reply) => {
    const params = InstanceIdParam.safeParse(req.params)
    if (!params.success) return reply.status(400).send({ error: 'VALIDATION_ERROR' })

    const result = registry.deregisterInstance(params.data.instanceId)
    if (result.isErr()) return reply.status(404).send({ error: result.error.code, message: result.error.message })
    return reply.status(204).send()
  })
}
