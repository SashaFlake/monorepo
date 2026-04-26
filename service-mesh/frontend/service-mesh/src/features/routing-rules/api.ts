import type { RoutingRule, RuleFormValues } from './types.js'

// ── Бэкенд DTO ───────────────────────────────────────────────────────────────
// Отражает текущий контракт backend/routing-rule.contracts.ts

type BackendDestination = {
  version?: string
  weightPct: number
}

type RoutingRuleDto = {
  id: string
  serviceId: string
  name: string
  priority: number
  match: { pathPrefix?: string; headers?: Record<string, string> }
  destination: BackendDestination
  createdAt: string
  updatedAt: string
}

// ── Query Keys ────────────────────────────────────────────────────────────────

export const routingKeys = {
  all:  () => ['routing-rules']                             as const,
  list: (serviceId: string) => ['routing-rules', serviceId] as const,
}

// ── Адаптеры (единственное место знания об ограничении бэкенда) ───────────────

const fromDto = (dto: RoutingRuleDto): RoutingRule => ({
  ...dto,
  // TODO: когда бэкенд добавит destinations[] — убрать эту строку
  destinations: [dto.destination],
})

const toCreateBody = (serviceId: string, form: RuleFormValues) => ({
  name: form.name,
  priority: form.priority,
  match: form.match,
  // TODO: когда бэкенд поддержит массив — передавать destinations[]
  destination: form.destinations[0],
})

const toUpdateBody = (form: Partial<RuleFormValues>) => ({
  ...(form.name !== undefined && { name: form.name }),
  ...(form.priority !== undefined && { priority: form.priority }),
  ...(form.match !== undefined && { match: form.match }),
  ...(form.destinations !== undefined && { destination: form.destinations[0] }),
})

// ── API ───────────────────────────────────────────────────────────────────────

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'
const api = (path: string) => `${BASE}/api/v1${path}`

export const routingRulesApi = {
  list: async (serviceId: string): Promise<RoutingRule[]> => {
    const res = await fetch(api(`/services/${serviceId}/routing-rules`))
    if (!res.ok) throw new Error(`list rules failed: ${res.status}`)
    const data: RoutingRuleDto[] = await res.json()
    return data.map(fromDto)
  },

  create: async (serviceId: string, form: RuleFormValues): Promise<RoutingRule> => {
    const res = await fetch(api(`/services/${serviceId}/routing-rules`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toCreateBody(serviceId, form)),
    })
    if (!res.ok) throw new Error(`create rule failed: ${res.status}`)
    return fromDto(await res.json())
  },

  update: async (ruleId: string, form: Partial<RuleFormValues>): Promise<RoutingRule> => {
    const res = await fetch(api(`/routing-rules/${ruleId}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toUpdateBody(form)),
    })
    if (!res.ok) throw new Error(`update rule failed: ${res.status}`)
    return fromDto(await res.json())
  },

  delete: async (ruleId: string): Promise<void> => {
    const res = await fetch(api(`/routing-rules/${ruleId}`), { method: 'DELETE' })
    if (!res.ok) throw new Error(`delete rule failed: ${res.status}`)
  },
}
