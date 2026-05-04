export type RuleStatus = 'active' | 'inactive'

export type RoutingRule = {
  id: string
  version: string
  weightPct: number
  status: RuleStatus
}
