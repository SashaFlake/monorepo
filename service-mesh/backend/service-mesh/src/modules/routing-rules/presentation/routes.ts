import type { FastifyInstance } from 'fastify'
import type { RoutingRuleService } from '../application/routing-rule.service.js'
import { makeRoutingRuleHandlers } from './routing-rule.handlers.js'

export const routingRulesRoutes =
  (service: RoutingRuleService) =>
  async (app: FastifyInstance) => {
    const handlers = makeRoutingRuleHandlers(service)

    app.get('/services/:serviceId/routing-rules',  handlers.list)
    app.post('/services/:serviceId/routing-rules', handlers.create)
    app.put('/routing-rules/:ruleId',              handlers.update)
    app.delete('/routing-rules/:ruleId',           handlers.delete)
  }
