// ── Типы UI (с запасом на traffic splitting) ─────────────────────────────────
//
// Бэкенд сейчас хранит один destination на правило.
// UI работает с массивом destinations[] — маппинг в api/api.ts.
// Когда бэкенд вырастет — меняем только адаптер.

export type Destination = {
  /** Для будущего cross-service routing */
  serviceId: string
  /** Целевая версия инстанса */
  version: string
  /** Доля трафика 0–100. Сумма всех destinations должна быть 100 */
  weightPct: number
}

export type RuleMatch = {
  pathPrefix?: string
  headers?: Record<string, string>
}

export type RoutingRule = {
  id: string
  serviceId: string
  name: string
  /** 0–1000, меньше = выше приоритет */
  priority: number
  match: RuleMatch
  destinations: Destination[]
  createdAt: string
  updatedAt: string
}

export type RuleFormValues = {
  name: string
  priority: number
  match: RuleMatch
  destinations: Destination[]
}
