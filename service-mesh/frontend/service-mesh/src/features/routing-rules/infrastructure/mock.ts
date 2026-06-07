import { Destination } from '../domain/types'
import type { RoutingRule } from '../domain/types'

/**
 * Mock routing rules for local development and storybook-style testing.
 *
 * Uses {@link Destination.unsafe} because these fixtures are hand-authored
 * and trusted; they skip domain validation to avoid coupling tests to the
 * validator's exact error messages.
 *
 * @sideEffects Calls `crypto.randomUUID()` once per destination when evaluated.
 */
export const MOCK_RULES: RoutingRule[] = [
  {
    id: 'rule-1',
    serviceId: 'svc-backend',
    name: 'api-gateway-split',
    priority: 100,
    match: { pathPrefix: '/api/v1/*' },
    destinations: [
      Destination.unsafe({ id: crypto.randomUUID(), version: 'v2', weightPct: 80 }),
      Destination.unsafe({ id: crypto.randomUUID(), version: 'v1', weightPct: 20 }),
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rule-2',
    serviceId: 'svc-health',
    name: 'health-check-route',
    priority: 10,
    match: { pathPrefix: '/health' },
    destinations: [
      Destination.unsafe({ id: crypto.randomUUID(), version: 'v1', weightPct: 100 }),
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]
