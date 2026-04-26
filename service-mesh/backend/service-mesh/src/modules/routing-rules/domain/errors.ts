/**
 * Domain errors for the routing-rules module.
 * Thrown by the service when a requested resource does not exist.
 */
export class RoutingRuleNotFoundError extends Error {
  readonly statusCode = 404
  constructor(ruleId: string) {
    super(`Routing rule ${ruleId} not found`)
    this.name = 'RoutingRuleNotFoundError'
  }
}
