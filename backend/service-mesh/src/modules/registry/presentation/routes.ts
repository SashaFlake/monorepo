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
  labels: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

/**
 * Группирует инстансы по полю metadata.version.
 * Инстансы без version попадают в группу "unknown".
 */
function groupByVersion<T extends { metadata: Record<string, string> }>(instances: T[]): Record<string, T[]> {
  const groups: Record<string, T[]> = {}
  for (const inst of instances) {
    const ver = inst.metadata['version'] ?? 'unknown'
    ;(groups[ver] ??= []).push(inst)
  }
  return groups
}

/** Мок-манифест. Заменим реальным после введения ServiceManifest-сущности. */
function mockManifest(serviceName: string, version: string) {
  return {
    apiVersion: 'mesh/v1alpha1',
    kind: 'ServiceManifest',
    metadata: {
      name: serviceName,
      version,
      generatedAt: new Date().toISOString(),
    },
    spec: {
      exposure: 'internal',
      protocol: 'http',
      ports: [
        { name: 'http', port: 3001, targetPort: 3001, protocol: 'TCP' },
      ],
      routing: {
        loadBalancing: 'round-robin',
        retries: 2,
        timeoutMs: 5000,
      },
      health: {
        path: '/health',
        intervalMs: 10000,
        ttlMs: 30000,
      },
    },
  }
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

type Opts = { registry: RegistryService }

export const registryRoutes: FastifyPluginAsync<Opts> = async (app, { registry }) => {

  // ── Services ──────────────────────────────────────────────────────────────

  app.post('/services', async (req, reply) => {
    const parsed = CreateServiceBody.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
    }
    const result = registry.createService(parsed.data)
    if (result.isErr()) return reply.status(400).send({ error: result.error.code, message: result.error.message })
    return reply.status(201).send(result.value)
  })

  app.get('/services', async (req, reply) => {
    const query = ListServicesQuery.safeParse(req.query)
    if (!query.success) return reply.status(400).send({ error: 'VALIDATION_ERROR' })

    const filter: { name?: string; labels?: Record<string, string> } = {}
    if (query.data.name)   filter.name   = query.data.name
    if (query.data.labels) filter.labels = parseLabelsQuery(query.data.labels)

    return reply.send(registry.listServices(filter))
  })

  app.get('/services/:serviceId', async (req, reply) => {
    const params = ServiceIdParam.safeParse(req.params)
    if (!params.success) return reply.status(400).send({ error: 'VALIDATION_ERROR' })

    const result = registry.getService(params.data.serviceId)
    if (result.isErr()) return reply.status(404).send({ error: result.error.code, message: result.error.message })
    return reply.send(result.value)
  })

  app.delete('/services/:serviceId', async (req, reply) => {
    const params = ServiceIdParam.safeParse(req.params)
    if (!params.success) return reply.status(400).send({ error: 'VALIDATION_ERROR' })

    const result = registry.deleteService(params.data.serviceId)
    if (result.isErr()) return reply.status(404).send({ error: result.error.code, message: result.error.message })
    return reply.status(204).send()
  })

  // ── Versions ──────────────────────────────────────────────────────────────
  //
  // GET /services/:serviceId/versions
  // Возвращает список версий с их инстансами и mock-манифестом.
  //
  app.get('/services/:serviceId/versions', async (req, reply) => {
    const params = ServiceIdParam.safeParse(req.params)
    if (!params.success) return reply.status(400).send({ error: 'VALIDATION_ERROR' })

    const result = registry.getService(params.data.serviceId)
    if (result.isErr()) return reply.status(404).send({ error: result.error.code, message: result.error.message })

    const svc = result.value
    const grouped = groupByVersion(svc.instances)

    const versions = Object.entries(grouped).map(([version, instances]) => ({
      version,
      instanceCount: instances.length,
      instances,
      manifest: mockManifest(svc.name, version),
    }))

    return reply.send({ serviceId: svc.id, serviceName: svc.name, versions })
  })

  // ── OpenAPI proxy ─────────────────────────────────────────────────────────
  //
  // GET /services/:serviceId/openapi?version=0.1.0
  // Берёт первый healthy инстанс нужной версии и проксирует его /openapi.json.
  // Если инстанс не отдаёт OpenAPI — возвращает 502 с понятным сообщением.
  //
  app.get('/services/:serviceId/openapi', async (req, reply) => {
    const params = ServiceIdParam.safeParse(req.params)
    if (!params.success) return reply.status(400).send({ error: 'VALIDATION_ERROR' })

    const version = (req.query as Record<string, string>)['version']

    const result = registry.getService(params.data.serviceId)
    if (result.isErr()) return reply.status(404).send({ error: result.error.code, message: result.error.message })

    const svc = result.value
    let candidates = svc.instances.filter(i => i.status === 'passing' || i.status === 'warning')
    if (version) candidates = candidates.filter(i => i.metadata['version'] === version)

    if (candidates.length === 0) {
      return reply.status(503).send({
        error: 'NO_HEALTHY_INSTANCE',
        message: version
          ? `No healthy instance found for version ${version}`
          : 'No healthy instance found',
      })
    }

    // round-robin: случайный из доступных
    const inst = candidates[Math.floor(Math.random() * candidates.length)]!
    const openapiUrl = `http://${inst.host}:${inst.port}/openapi.json`

    try {
      const upstream = await fetch(openapiUrl, { signal: AbortSignal.timeout(5000) })
      if (!upstream.ok) {
        return reply.status(502).send({
          error: 'UPSTREAM_ERROR',
          message: `Instance returned ${upstream.status}`,
          url: openapiUrl,
        })
      }
      const json = await upstream.json()
      return reply.send(json)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return reply.status(502).send({
        error: 'UPSTREAM_UNREACHABLE',
        message: msg,
        url: openapiUrl,
      })
    }
  })

  // ── Instances ─────────────────────────────────────────────────────────────

  app.post('/instances', async (req, reply) => {
    const parsed = RegisterInstanceBody.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
    }
    const result = registry.registerInstance(parsed.data)
    if (result.isErr()) return reply.status(404).send({ error: result.error.code, message: result.error.message })
    return reply.status(201).send(result.value)
  })

  app.put('/instances/:instanceId/heartbeat', async (req, reply) => {
    const params = InstanceIdParam.safeParse(req.params)
    if (!params.success) return reply.status(400).send({ error: 'VALIDATION_ERROR' })

    const result = registry.heartbeat(params.data.instanceId)
    if (result.isErr()) return reply.status(404).send({ error: result.error.code, message: result.error.message })
    return reply.status(204).send()
  })

  app.delete('/instances/:instanceId', async (req, reply) => {
    const params = InstanceIdParam.safeParse(req.params)
    if (!params.success) return reply.status(400).send({ error: 'VALIDATION_ERROR' })

    const result = registry.deregisterInstance(params.data.instanceId)
    if (result.isErr()) return reply.status(404).send({ error: result.error.code, message: result.error.message })
    return reply.status(204).send()
  })
}
