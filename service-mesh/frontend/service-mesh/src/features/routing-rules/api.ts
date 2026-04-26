// ---------------------------------------------------------------------------
// Routing Rules — API client + query keys
// ---------------------------------------------------------------------------

import type { RoutingRule, CreateRuleInput, UpdateRuleInput } from './types'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export const routingApi = {
  list: (): Promise<RoutingRule[]> =>
    apiFetch<RoutingRule[]>('/api/v1/routes'),

  get: (id: string): Promise<RoutingRule> =>
    apiFetch<RoutingRule>(`/api/v1/routes/${id}`),

  create: (input: CreateRuleInput): Promise<RoutingRule> =>
    apiFetch<RoutingRule>('/api/v1/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),

  update: (id: string, input: UpdateRuleInput): Promise<RoutingRule> =>
    apiFetch<RoutingRule>(`/api/v1/routes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),

  delete: (id: string): Promise<void> =>
    apiFetch<void>(`/api/v1/routes/${id}`, { method: 'DELETE' }),
}

export const routingKeys = {
  all:  ['routing-rules'] as const,
  list: () => [...routingKeys.all, 'list'] as const,
  rule: (id: string) => [...routingKeys.all, 'rule', id] as const,
}
