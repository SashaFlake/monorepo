import type { FastifyRequest, FastifyReply } from 'fastify'
import type { RegistryService } from '../../application/registry.service.js'
import {
  ServiceSchemas,
  type CreateServiceBody,
  type ServiceIdParam,
  type ListServicesQuery,
} from '../contracts/service.contracts.js'

// ---------------------------------------------------------------------------
// Helpers (domain-specific, co-located with the handlers that use them)
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

function groupByVersion<T extends { metadata: Record<string, string> }>(
  instances: T[],
): Record<string, T[]> {
  const groups: Record<string, T[]> = {}
  for (const inst of instances) {
    const ver = inst.metadata['version'] ?? 'unknown'
    ;(groups[ver] ??= []).push(inst)
  }
  return groups
}

/** Temporary mock — replace when ServiceManifest entity is introduced. */
function mockManifest(serviceName: string, version: string) {
  return {
    apiVersion: 'mesh/v1alpha1',
    kind: 'ServiceManifest',
    metadata: { name: serviceName, version, generatedAt: new Date().toISOString() },
    spec: {
      exposure: 'internal',
      protocol: 'http',
      ports: [{ name: 'http', port: 3001, targetPort: 3001, protocol: 'TCP' }],
      routing: { loadBalancing: 'round-robin', retries: 2, timeoutMs: 5000 },
      health: { path: '/health', intervalMs: 10000, ttlMs: 30000 },
    },
  }
}

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

/**
 * Returns named handler functions bound to the RegistryService.
 * Each handler is a pure async function — no Fastify plugin magic.
 */
export const makeServiceHandlers = (registry: RegistryService) => ({

  create: async (
    req: FastifyRequest<{ Body: CreateServiceBody }>,
    reply: FastifyReply,
  ) => {
    const parsed = ServiceSchemas.CreateBody.safeParse(req.body)
    if (!parsed.success)
      return reply.status(400).send({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })

    const result = registry.createService(parsed.data)
    if (result.isErr())
      return reply.status(400).send({ error: result.error.code, message: result.error.message })

    return reply.status(201).send(result.value)
  },

  list: async (
    req: FastifyRequest<{ Querystring: ListServicesQuery }>,
    reply: FastifyReply,
  ) => {
    const query = ServiceSchemas.ListQuery.safeParse(req.query)
    if (!query.success)
      return reply.status(400).send({ error: 'VALIDATION_ERROR' })

    const filter: { name?: string; labels?: Record<string, string> } = {}
    if (query.data.name)   filter.name   = query.data.name
    if (query.data.labels) filter.labels = parseLabelsQuery(query.data.labels)

    return reply.send(registry.listServices(filter))
  },

  getById: async (
    req: FastifyRequest<{ Params: ServiceIdParam }>,
    reply: FastifyReply,
  ) => {
    const params = ServiceSchemas.ServiceIdParam.safeParse(req.params)
    if (!params.success)
      return reply.status(400).send({ error: 'VALIDATION_ERROR' })

    const result = registry.getService(params.data.serviceId)
    if (result.isErr())
      return reply.status(404).send({ error: result.error.code, message: result.error.message })

    return reply.send(result.value)
  },

  delete: async (
    req: FastifyRequest<{ Params: ServiceIdParam }>,
    reply: FastifyReply,
  ) => {
    const params = ServiceSchemas.ServiceIdParam.safeParse(req.params)
    if (!params.success)
      return reply.status(400).send({ error: 'VALIDATION_ERROR' })

    const result = registry.deleteService(params.data.serviceId)
    if (result.isErr())
      return reply.status(404).send({ error: result.error.code, message: result.error.message })

    return reply.status(204).send()
  },

  getVersions: async (
    req: FastifyRequest<{ Params: ServiceIdParam }>,
    reply: FastifyReply,
  ) => {
    const params = ServiceSchemas.ServiceIdParam.safeParse(req.params)
    if (!params.success)
      return reply.status(400).send({ error: 'VALIDATION_ERROR' })

    const result = registry.getService(params.data.serviceId)
    if (result.isErr())
      return reply.status(404).send({ error: result.error.code, message: result.error.message })

    const svc = result.value
    const grouped = groupByVersion(svc.instances)

    const versions = Object.entries(grouped).map(([version, instances]) => ({
      version,
      instanceCount: instances.length,
      instances,
      manifest: mockManifest(svc.name, version),
    }))

    return reply.send({ serviceId: svc.id, serviceName: svc.name, versions })
  },

  getOpenApi: async (
    req: FastifyRequest<{ Params: ServiceIdParam; Querystring: { version?: string } }>,
    reply: FastifyReply,
  ) => {
    const params = ServiceSchemas.ServiceIdParam.safeParse(req.params)
    if (!params.success)
      return reply.status(400).send({ error: 'VALIDATION_ERROR' })

    const version = (req.query as Record<string, string>)['version']

    const result = registry.getService(params.data.serviceId)
    if (result.isErr())
      return reply.status(404).send({ error: result.error.code, message: result.error.message })

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
      return reply.send(await upstream.json())
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return reply.status(502).send({ error: 'UPSTREAM_UNREACHABLE', message: msg, url: openapiUrl })
    }
  },
})

export type ServiceHandlers = ReturnType<typeof makeServiceHandlers>
