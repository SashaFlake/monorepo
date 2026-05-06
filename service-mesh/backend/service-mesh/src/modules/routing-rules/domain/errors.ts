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
