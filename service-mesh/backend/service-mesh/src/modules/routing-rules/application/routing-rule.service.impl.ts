import { ok, err, type Result } from 'neverthrow'
import { randomUUID } from 'node:crypto'
import type { RoutingRule, CreateRoutingRuleDto, UpdateRoutingRuleDto } from '../domain/routing-rule.js'
import { routingRuleError, type RoutingRuleError } from '../domain/errors.js'
import type { RoutingRuleService } from './routing-rule.service.js'

/**
 * In-memory implementation of RoutingRuleService.
 * Stores rules in a Map grouped by serviceId.
 * Uses Result<T, E> pattern for type-safe error handling.
 */
export class RoutingRuleServiceImpl implements RoutingRuleService {
  private readonly rules = new Map<string, RoutingRule>()

  list(serviceId: string): RoutingRule[] {
    return [...this.rules.values()]
      .filter(r => r.serviceId === serviceId)
      .sort((a, b) => a.priority - b.priority)
  }

  create(serviceId: string, data: CreateRoutingRuleDto): Result<RoutingRule, RoutingRuleError> {
    const now  = new Date().toISOString()
    const rule: RoutingRule = {
      ...data,
      id:        randomUUID(),
      serviceId,
      createdAt: now,
      updatedAt: now,
    }
    this.rules.set(rule.id, rule)
    return ok(rule)
  }

  update(ruleId: string, data: UpdateRoutingRuleDto): Result<RoutingRule, RoutingRuleError> {
    const existing = this.rules.get(ruleId)
    if (!existing) {
      return err(routingRuleError('RULE_NOT_FOUND', `Routing rule ${ruleId} not found`))
    }

    const updated: RoutingRule = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    }
    this.rules.set(ruleId, updated)
    return ok(updated)
  }

  delete(ruleId: string): Result<void, RoutingRuleError> {
    if (!this.rules.has(ruleId)) {
      return err(routingRuleError('RULE_NOT_FOUND', `Routing rule ${ruleId} not found`))
    }
    this.rules.delete(ruleId)
    return ok(undefined)
  }
}
