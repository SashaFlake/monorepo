import type { FastifyPluginAsync } from 'fastify'
import type { RoutingRuleService } from '../application/routing-rule.service.js'
import { makeRoutingRuleHandlers } from './handlers/routing-rule.handlers.js'

type Opts = { routingRuleService: RoutingRuleService }

/**
 * Routing Rules plugin — only route registration lives here.
 * Business logic   → application/routing-rule.service.ts
 * Validation       → presentation/contracts/routing-rule.contracts.ts
 * Request handling → presentation/handlers/routing-rule.handlers.ts
 */
export const routingRulesRoutes: FastifyPluginAsync<Opts> = async (app, { routingRuleService }) => {
  const handlers = makeRoutingRuleHandlers(routingRuleService)

  // ── Routing Rules ─────────────────────────────────────────────────────────
  app.get('/services/:serviceId/routing-rules',  handlers.list)
  app.post('/services/:serviceId/routing-rules', handlers.create)
  app.put('/routing-rules/:ruleId',              handlers.update)
  app.delete('/routing-rules/:ruleId',           handlers.delete)
}
