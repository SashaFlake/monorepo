import { randomUUID } from 'node:crypto'
import type { RoutingRule, CreateRoutingRuleDto, UpdateRoutingRuleDto } from '../domain/routing-rule.js'
import { RoutingRuleNotFoundError } from '../domain/errors.js'
import type { RoutingRuleService } from './routing-rule.service.js'

/**
 * In-memory implementation of RoutingRuleService.
 * Stores rules in a Map grouped by serviceId.
 */
export class RoutingRuleServiceImpl implements RoutingRuleService {
  private readonly rules = new Map<string, RoutingRule>()

  list(serviceId: string): RoutingRule[] {
    return [...this.rules.values()]
      .filter(r => r.serviceId === serviceId)
      .sort((a, b) => a.priority - b.priority)
  }

  create(serviceId: string, data: CreateRoutingRuleDto): RoutingRule {
    const now  = new Date().toISOString()
    const rule: RoutingRule = {
      ...data,
      id:        randomUUID(),
      serviceId,
      createdAt: now,
      updatedAt: now,
    }
    this.rules.set(rule.id, rule)
    return rule
  }

  update(ruleId: string, data: UpdateRoutingRuleDto): RoutingRule {
    const existing = this.rules.get(ruleId)
    if (!existing) throw new RoutingRuleNotFoundError(ruleId)

    const updated: RoutingRule = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    }
    this.rules.set(ruleId, updated)
    return updated
  }

  delete(ruleId: string): void {
    if (!this.rules.has(ruleId)) throw new RoutingRuleNotFoundError(ruleId)
    this.rules.delete(ruleId)
  }
}
