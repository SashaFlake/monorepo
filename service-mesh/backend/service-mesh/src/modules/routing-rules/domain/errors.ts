/**
 * Domain errors for the routing-rules module.
 * Uses Result<T, E> pattern with neverthrow for type-safe error handling.
 */

export type RoutingRuleErrorCode =
  | 'RULE_NOT_FOUND'
  | 'SERVICE_NOT_FOUND'
  | 'VALIDATION_ERROR'

export type RoutingRuleError = {
  readonly code: RoutingRuleErrorCode
  readonly message: string
}

export const routingRuleError = (
  code: RoutingRuleErrorCode,
  message: string,
): RoutingRuleError => ({ code, message })

/**
 * Error class for cases where a rule with the given id does not exist.
 * Kept as a class for future throw-based adapters (e.g. HTTP controllers
 * that translate domain errors to HTTP status codes via instanceof checks).
 * Tests use Result.isErr() + error.code instead of assert.throws.
 */
export class RoutingRuleNotFoundError extends Error {
  readonly code = 'RULE_NOT_FOUND' as const
  constructor(ruleId: string) {
    super(`Routing rule ${ruleId} not found`)
    this.name = 'RoutingRuleNotFoundError'
  }
}
