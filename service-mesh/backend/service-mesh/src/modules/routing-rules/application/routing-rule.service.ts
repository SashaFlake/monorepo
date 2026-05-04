import type { Result } from 'neverthrow'
import type { RoutingRule, CreateRoutingRuleDto, UpdateRoutingRuleDto } from '../domain/routing-rule.js'
import type { RoutingRuleError } from '../domain/errors.js'

/**
 * Интерфейс модуля routing-rules.
 * Presentation-слой знает только этот контракт — не реализацию.
 * Все методы возвращают Result<T, RoutingRuleError> для type-safe error handling.
 */
export interface RoutingRuleService {
  list(serviceId: string): RoutingRule[]
  create(serviceId: string, data: CreateRoutingRuleDto): Result<RoutingRule, RoutingRuleError>
  update(ruleId: string, data: UpdateRoutingRuleDto): Result<RoutingRule, RoutingRuleError>
  delete(ruleId: string): Result<void, RoutingRuleError>
}
