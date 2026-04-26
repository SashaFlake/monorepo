/**
 * Доменные типы модуля routing-rules.
 */

export interface RoutingRuleMatch {
  headers?: Record<string, string>
  pathPrefix?: string
}

export interface RoutingRuleDestination {
  version?: string
  weightPct: number
}

export interface RoutingRule {
  id: string
  serviceId: string
  name: string
  priority: number
  match: RoutingRuleMatch
  destination: RoutingRuleDestination
  createdAt: string
  updatedAt: string
}

export type CreateRoutingRuleDto = Omit<RoutingRule, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateRoutingRuleDto = Partial<Omit<RoutingRule, 'id' | 'serviceId' | 'createdAt' | 'updatedAt'>>
