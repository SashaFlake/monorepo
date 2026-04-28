// ── Routing Rules API ─────────────────────────────────────────────────────────
// Типы домена живут в ../model/types.ts
// HTTP-helper импортируется из lib/http.ts — единый fetch для всего приложения

import { apiFetch, endpoint } from '@/lib/http'
import type { RoutingRule, RuleFormValues } from '../model/types'

// ── Query keys ────────────────────────────────────────────────────────────────

export const routingKeys = {
  all:  () => ['routing-rules']                              as const,
  list: (serviceId: string) => ['routing-rules', serviceId] as const,
}

// ── API client ────────────────────────────────────────────────────────────────

export const routingRulesApi = {
  list: (serviceId: string): Promise<RoutingRule[]> =>
    apiFetch<RoutingRule[]>(endpoint(`/services/${serviceId}/routing-rules`)),

  create: (serviceId: string, form: RuleFormValues): Promise<RoutingRule> =>
    apiFetch<RoutingRule>(endpoint(`/services/${serviceId}/routing-rules`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:         form.name,
        priority:     form.priority,
        match:        form.match,
        destinations: form.destinations,
      }),
    }),

  update: (ruleId: string, form: Partial<RuleFormValues>): Promise<RoutingRule> =>
    apiFetch<RoutingRule>(endpoint(`/routing-rules/${ruleId}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(form.name         !== undefined && { name:         form.name }),
        ...(form.priority     !== undefined && { priority:     form.priority }),
        ...(form.match        !== undefined && { match:        form.match }),
        ...(form.destinations !== undefined && { destinations: form.destinations }),
      }),
    }),

  delete: (ruleId: string): Promise<void> =>
    apiFetch<void>(endpoint(`/routing-rules/${ruleId}`), { method: 'DELETE' }),
}
