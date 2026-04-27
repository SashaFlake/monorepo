import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import type { RoutingRuleService } from '../application/routing-rule.service.js'
import { makeRoutingRuleHandlers } from './handlers/routing-rule.handlers.js'
import {
  ListRulesContract,
  CreateRuleContract,
  UpdateRuleContract,
  DeleteRuleContract,
} from './contracts/routing-rule.contracts.js'

type Opts = { routingRuleService: RoutingRuleService }

/**
 * Routing Rules plugin — only route registration lives here.
 * Business logic   → application/routing-rule.service.ts
 * Validation       → presentation/contracts/routing-rule.contracts.ts
 * Request handling → presentation/handlers/routing-rule.handlers.ts
 */
export const routingRulesRoutes: FastifyPluginAsyncZod<Opts> = async (app, { routingRuleService }) => {
  const handlers = makeRoutingRuleHandlers(routingRuleService)

  // ── Routing Rules ─────────────────────────────────────────────────────────
  app.get(
    ListRulesContract.path,
    { schema: { tags: ListRulesContract.tags, summary: ListRulesContract.summary, params: ListRulesContract.params } },
    handlers.list,
  )

  app.post(
    CreateRuleContract.path,
    { schema: { tags: CreateRuleContract.tags, summary: CreateRuleContract.summary, params: CreateRuleContract.params, body: CreateRuleContract.body } },
    handlers.create,
  )

  app.put(
    UpdateRuleContract.path,
    { schema: { tags: UpdateRuleContract.tags, summary: UpdateRuleContract.summary, params: UpdateRuleContract.params, body: UpdateRuleContract.body } },
    handlers.update,
  )

  app.delete(
    DeleteRuleContract.path,
    { schema: { tags: DeleteRuleContract.tags, summary: DeleteRuleContract.summary, params: DeleteRuleContract.params } },
    handlers.delete,
  )
}
