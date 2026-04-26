import type { RoutingRule, CreateRoutingRuleDto, UpdateRoutingRuleDto } from '../domain/routing-rule.js'

/**
 * Интерфейс модуля routing-rules.
 * Presentation-слой знает только этот контракт — не реализацию.
 */
export interface RoutingRuleService {
  list(serviceId: string): RoutingRule[]
  create(serviceId: string, data: CreateRoutingRuleDto): RoutingRule
  update(ruleId: string, data: UpdateRoutingRuleDto): RoutingRule
  delete(ruleId: string): void
}
