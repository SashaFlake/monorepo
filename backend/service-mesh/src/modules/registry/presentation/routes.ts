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

const ListServicesQuery = z.object({
  name:   z.string().optional(),
  labels: z.string().optional(), // "key1=val1,key2=val2"
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Парсит строку вида "env=prod,version=1.0" в Record<string, string>.
 * Пары без '=' игнорируются.
 */
function parseLabelsQuery(raw: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const pair of raw.split(',')) {
    const eqIdx = pair.indexOf('=')
    if (eqIdx === -1) continue
    const key = pair.slice(0, eqIdx).trim()
    const val = pair.slice(eqIdx + 1).trim()
    if (key) result[key] = val
  }
  return result
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

type Opts = { registry: RegistryService }

export const registryRoutes: FastifyPluginAsync<Opts> = async (app, { registry }) => {

  // ── Services ──────────────────────────────────────────────────────────────

  // POST /services — upsert: вернёт существующий или создаст новый
  app.post('/services', async (req, reply) => {
    const parsed = CreateServiceBody.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
    }
    const result = registry.createService(parsed.data)
    if (result.isErr()) return reply.status(400).send({ error: result.error.code, message: result.error.message })
    return reply.status(201).send(result.value)
  })

  // GET /services?name=foo&labels=env=prod,version=1.0
  app.get('/services', async (req, reply) => {
    const query = ListServicesQuery.safeParse(req.query)
    if (!query.success) return reply.status(400).send({ error: 'VALIDATION_ERROR' })

    const filter: { name?: string; labels?: Record<string, string> } = {}
    if (query.data.name)   filter.name   = query.data.name
    if (query.data.labels) filter.labels = parseLabelsQuery(query.data.labels)

    return reply.send(registry.listServices(filter))
  })

  // GET /services/:serviceId
  app.get('/services/:serviceId', async (req, reply) => {
    const params = ServiceIdParam.safeParse(req.params)
    if (!params.success) return reply.status(400).send({ error: 'VALIDATION_ERROR' })

    const result = registry.getService(params.data.serviceId)
    if (result.isErr()) return reply.status(404).send({ error: result.error.code, message: result.error.message })
    return reply.send(result.value)
  })

  // DELETE /services/:serviceId
  app.delete('/services/:serviceId', async (req, reply) => {
    const params = ServiceIdParam.safeParse(req.params)
    if (!params.success) return reply.status(400).send({ error: 'VALIDATION_ERROR' })

    const result = registry.deleteService(params.data.serviceId)
    if (result.isErr()) return reply.status(404).send({ error: result.error.code, message: result.error.message })
    return reply.status(204).send()
  })

  // ── Instances ─────────────────────────────────────────────────────────────

  // POST /instances
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

  // DELETE /instances/:instanceId
  app.delete('/instances/:instanceId', async (req, reply) => {
    const params = InstanceIdParam.safeParse(req.params)
    if (!params.success) return reply.status(400).send({ error: 'VALIDATION_ERROR' })

    const result = registry.deregisterInstance(params.data.instanceId)
    if (result.isErr()) return reply.status(404).send({ error: result.error.code, message: result.error.message })
    return reply.status(204).send()
  })
}
