import type { FastifyPluginAsync } from 'fastify'
import type { RegistryService } from '../application/registry.service.js'
import { makeServiceHandlers }     from './handlers/service.handlers.js'
import { makeInstanceHandlers }    from './handlers/instance.handlers.js'
import { makeRoutingRuleHandlers } from './handlers/routing-rule.handlers.js'

type Opts = { registry: RegistryService }

/**
 * Registry plugin — only route registration lives here.
 * Business logic   → application/registry.service.ts
 * Validation       → presentation/contracts/*.contracts.ts
 * Request handling → presentation/handlers/*.handlers.ts
 */
export const registryRoutes: FastifyPluginAsync<Opts> = async (app, { registry }) => {
  const services = makeServiceHandlers(registry)
  const instances = makeInstanceHandlers(registry)
  const rules = makeRoutingRuleHandlers(registry)

  // ── Services ─────────────────────────────────────────────────────────────
  app.post('/services',                          services.create)
  app.get('/services',                           services.list)
  app.get('/services/:serviceId',                services.getById)
  app.delete('/services/:serviceId',             services.delete)
  app.get('/services/:serviceId/versions',       services.getVersions)
  app.get('/services/:serviceId/openapi',        services.getOpenApi)

  // ── Instances ────────────────────────────────────────────────────────────
  app.post('/instances',                         instances.register)
  app.put('/instances/:instanceId/heartbeat',    instances.heartbeat)
  app.delete('/instances/:instanceId',           instances.deregister)

  // ── Routing Rules ────────────────────────────────────────────────────────
  app.get('/services/:serviceId/routing-rules',  rules.list)
  app.post('/services/:serviceId/routing-rules', rules.create)
  app.put('/routing-rules/:ruleId',              rules.update)
  app.delete('/routing-rules/:ruleId',           rules.delete)
}
