import type { RoutingRule, RuleFormValues } from '../model/types'

// ── Query Keys ────────────────────────────────────────────────────────────────

export const routingKeys = {
  all:  () => ['routing-rules']                             as const,
  list: (serviceId: string) => ['routing-rules', serviceId] as const,
}

// ── API ───────────────────────────────────────────────────────────────────────

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'
const endpoint = (path: string) => `${BASE}/api/v1${path}`

export const routingRulesApi = {
  list: async (serviceId: string): Promise<RoutingRule[]> => {
    const res = await fetch(endpoint(`/services/${serviceId}/routing-rules`))
    if (!res.ok) throw new Error(`list rules failed: ${res.status}`)
    return res.json()
  },

  create: async (serviceId: string, form: RuleFormValues): Promise<RoutingRule> => {
    const res = await fetch(endpoint(`/services/${serviceId}/routing-rules`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:         form.name,
        priority:     form.priority,
        match:        form.match,
        destinations: form.destinations,
      }),
    })
    if (!res.ok) throw new Error(`create rule failed: ${res.status}`)
    return res.json()
  },

  update: async (ruleId: string, form: Partial<RuleFormValues>): Promise<RoutingRule> => {
    const res = await fetch(endpoint(`/routing-rules/${ruleId}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(form.name         !== undefined && { name:         form.name }),
        ...(form.priority     !== undefined && { priority:     form.priority }),
        ...(form.match        !== undefined && { match:        form.match }),
        ...(form.destinations !== undefined && { destinations: form.destinations }),
      }),
    })
    if (!res.ok) throw new Error(`update rule failed: ${res.status}`)
    return res.json()
  },

  delete: async (ruleId: string): Promise<void> => {
    const res = await fetch(endpoint(`/routing-rules/${ruleId}`), { method: 'DELETE' })
    if (!res.ok) throw new Error(`delete rule failed: ${res.status}`)
  },
}
