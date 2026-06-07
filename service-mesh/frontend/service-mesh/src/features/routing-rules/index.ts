/**
 * Public API of the `routing-rules-ui` bounded context.
 *
 * Exports domain types, the REST client, query keys, the application hook,
 * and the page component used by the service detail tabs.
 */
export * from './domain/types'
export { routingRulesApi, routingKeys } from './infrastructure/api'
export { useRoutingRules } from './application/useRoutingRules'
export { RoutingRulesPage } from './ui/RoutingRulesPage'
