// ---------------------------------------------------------------------------
// Registry — Domain Model
// ---------------------------------------------------------------------------

export type ServiceName = string & { readonly _brand: 'ServiceName' }
export type InstanceId  = string & { readonly _brand: 'InstanceId' }

export const serviceName = (v: string): ServiceName => v as ServiceName
export const instanceId  = (v: string): InstanceId  => v as InstanceId

export type InstanceStatus = 'passing' | 'warning' | 'critical'

/**
 * Результат последней активной проверки health check.
 * null — проверка ещё не проводилась (инстанс только что зарегистрировался).
 */
export type HealthCheckResult = {
  readonly checkedAt:  Date
  readonly ok:         boolean
  readonly statusCode: number | null   // null если сеть недоступна
  readonly latencyMs:  number
}

/**
 * Инстанс зарегистрированного сервиса.
 * Иммутабельный value object — обновление = новый объект.
 */
export type ServiceInstance = {
  readonly id:              InstanceId
  readonly serviceName:     ServiceName
  readonly host:            string
  readonly port:            number
  readonly healthPath:      string          // по умолчанию /health
  readonly metadata:        Record<string, string>
  readonly registeredAt:    Date
  readonly lastHeartbeatAt: Date
  readonly lastHealthCheck: HealthCheckResult | null
}

/**
 * Итоговый статус = worst(ttlStatus, healthCheckStatus).
 *
 * TTL:
 *   passing  → heartbeat < ttl/2 ago
 *   warning  → heartbeat < ttl ago
 *   critical → heartbeat >= ttl ago
 *
 * Health check:
 *   passing  → последняя проверка ok
 *   critical → последняя проверка !ok
 *   passing  → проверка ещё не проводилась (даём grace period)
 *
 * Итог: если хотя бы одно critical — critical.
 *        если хотя бы одно warning  — warning.
 *        иначе                      — passing.
 */
export const deriveStatus = (
  instance: ServiceInstance,
  ttlMs: number,
): InstanceStatus => {
  // TTL статус
  const elapsed = Date.now() - instance.lastHeartbeatAt.getTime()
  const ttlStatus: InstanceStatus =
    elapsed < ttlMs / 2 ? 'passing' :
    elapsed < ttlMs     ? 'warning' :
    'critical'

  // Health check статус
  const hcStatus: InstanceStatus =
    instance.lastHealthCheck === null ? 'passing' :   // grace period
    instance.lastHealthCheck.ok       ? 'passing' :
    'critical'

  // Worst-case
  if (ttlStatus === 'critical' || hcStatus === 'critical') return 'critical'
  if (ttlStatus === 'warning')                             return 'warning'
  return 'passing'
}

export type ServiceInstanceView = ServiceInstance & {
  readonly status: InstanceStatus
}

export const toView = (
  instance: ServiceInstance,
  ttlMs: number,
): ServiceInstanceView => ({
  ...instance,
  status: deriveStatus(instance, ttlMs),
})
