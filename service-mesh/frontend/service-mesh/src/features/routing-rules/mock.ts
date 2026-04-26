// ---------------------------------------------------------------------------
// Routing Rules — моковые данные для разработки без бэкенда
// ---------------------------------------------------------------------------

import type { RoutingRule } from './types'

export const MOCK_RULES: RoutingRule[] = [
  {
    id: 'rule-1',
    name: 'api-gateway-split',
    match: { path: '/api/v1/*' },
    upstreams: [
      { serviceId: 'svc-backend-v2', weight: 80 },
      { serviceId: 'svc-backend-v1', weight: 20 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rule-2',
    name: 'health-check-route',
    match: { path: '/health' },
    upstreams: [
      { serviceId: 'svc-health', weight: 100 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]
