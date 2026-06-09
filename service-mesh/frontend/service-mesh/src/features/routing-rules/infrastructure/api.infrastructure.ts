// ── Routing Rules API ───────────────────────────────────────────────────────
// Domain types live in ../domain/routing-rules.types.ts
// HTTP helper is imported from lib/http.ts — unified fetch for the whole app

import { Schema } from 'effect'
import { apiFetch, apiFetchVoid, endpoint } from '@/lib/http.ts'
import type { RoutingRule, RuleFormValues } from '../domain/routing-rules.types'
import { RoutingRuleSchema } from '../domain/routing-rules.dto'

// ── Query keys ───────────────────────────────────────────────────────────────

/**
 * TanStack Query keys for routing-rules.
 *
 * @sideEffects none
 */
export const routingKeys = {
  all:  () => ['routing-rules']                              as const,
  list: (serviceId: string) => ['routing-rules', serviceId] as const,
}

// ── API client ───────────────────────────────────────────────────────────────

/**
 * CRUD client for the routing-rules REST endpoints.
 *
 * All methods return plain `Promise<T>` (wrapped by TanStack Query in the
 * application layer).  The {@link RoutingRuleSchema} is used for runtime
 * validation of responses via {@link apiFetch}.
 *
 * @sideEffects Performs HTTP requests.
 */
export const routingRulesApi = {
  /**
   * Lists all routing rules for a given service.
   *
   * @param serviceId – ID of the service whose rules to fetch
   * @returns Promise resolving to an array of {@link RoutingRule}
   * @sideEffects HTTP GET
   */
  list: (serviceId: string): Promise<RoutingRule[]> =>
    apiFetch(endpoint(`/services/${serviceId}/routing-rules`), Schema.mutable(Schema.Array(RoutingRuleSchema))),

  /**
   * Creates a new routing rule.
   *
   * @param serviceId – owning service ID
   * @param form      – complete rule form values
   * @returns Promise resolving to the created {@link RoutingRule}
   * @sideEffects HTTP POST
   */
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

  /**
   * Updates an existing routing rule.  Expects a complete form submission —
   * `Partial<>` was too permissive and allowed accidental partial updates.
   *
   * @param ruleId – ID of the rule to update
   * @param form   – complete rule form values
   * @returns Promise resolving to the updated {@link RoutingRule}
   * @sideEffects HTTP PUT
   */
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

  /**
   * Deletes a routing rule by ID.
   *
   * @param ruleId – ID of the rule to delete
   * @returns Promise resolving to void
   * @sideEffects HTTP DELETE
   */
  delete: (ruleId: string): Promise<void> =>
    apiFetchVoid(endpoint(`/routing-rules/${ruleId}`), { method: 'DELETE' }),
}
