// ---------------------------------------------------------------------------
// Routing Rules — domain types
// ---------------------------------------------------------------------------

export type Upstream = {
  serviceId: string
  weight: number  // 0–100, сумма всех upstreams в правиле должна быть 100
}

export type RoutingRule = {
  id: string
  name: string
  match: {
    host?: string
    path?: string
    headers?: Record<string, string>
  }
  upstreams: Upstream[]
  createdAt: string
  updatedAt: string
}

// Форма создания/редактирования — без id и дат
export type RuleFormValues = {
  name: string
  match: {
    host: string
    path: string
  }
  upstreams: Upstream[]
}

export type CreateRuleInput = RuleFormValues
export type UpdateRuleInput = RuleFormValues
