// ── Routing Rules API ───────────────────────────────────────────────────────────────────
// Типы домена живут в ../model/types.ts
// HTTP-helper импортируется из lib/http.ts — единый fetch для всего приложения

import { Schema } from 'effect'
import { apiFetch, apiFetchVoid, endpoint } from '@/lib/http.ts'
import type { RoutingRule, RuleFormValues } from '../domain/types'
import { RoutingRuleSchema } from '../domain/schema'

// ── Query keys ───────────────────────────────────────────────────────────────────────────

export const routingKeys = {
  all:  () => ['routing-rules']                              as const,
  list: (serviceId: string) => ['routing-rules', serviceId] as const,
}

// ── API client ────────────────────────────────────────────────────────────────

export const routingRulesApi = {
  list: (serviceId: string): Promise<RoutingRule[]> =>
    apiFetch(endpoint(`/services/${serviceId}/routing-rules`), Schema.Array(RoutingRuleSchema)),

  create: (serviceId: string, form: RuleFormValues): Promise<RoutingRule> =>
    apiFetch(endpoint(`/services/${serviceId}/routing-rules`), RoutingRuleSchema, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:         form.name,
        priority:     form.priority,
        match:        form.match,
        destinations: form.destinations,
      }),
    }),

  // update always receives a complete form submission — Partial<> was too permissive
  update: (ruleId: string, form: RuleFormValues): Promise<RoutingRule> =>
    apiFetch(endpoint(`/routing-rules/${ruleId}`), RoutingRuleSchema, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:         form.name,
        priority:     form.priority,
        match:        form.match,
        destinations: form.destinations,
      }),
    }),

  delete: (ruleId: string): Promise<void> =>
    apiFetchVoid(endpoint(`/routing-rules/${ruleId}`), { method: 'DELETE' }),
}
