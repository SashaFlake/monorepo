// ---------------------------------------------------------------------------
// Registry — Domain Model
// Намеренно простой для прототипа. Value objects, никаких классов.
// ---------------------------------------------------------------------------

export type ServiceName = string & { readonly _brand: 'ServiceName' }
export type InstanceId  = string & { readonly _brand: 'InstanceId' }

export const serviceName = (v: string): ServiceName => v as ServiceName
export const instanceId  = (v: string): InstanceId  => v as InstanceId

// Статус инстанса выводится динамически из last_heartbeat_at + TTL
export type InstanceStatus = 'passing' | 'warning' | 'critical'

/**
 * Инстанс зарегистрированного сервиса.
 * Иммутабельный value object — обновление = новый объект.
 */
export type ServiceInstance = {
  readonly id:              InstanceId
  readonly serviceName:     ServiceName
  readonly host:            string
  readonly port:            number
  readonly metadata:        Record<string, string>
  readonly registeredAt:    Date
  readonly lastHeartbeatAt: Date
}

/**
 * Derive instance status from last heartbeat + ttl.
 * passing  → heartbeat < ttl/2 ago
 * warning  → heartbeat < ttl ago
 * critical → heartbeat >= ttl ago
 */
export const deriveStatus = (
  instance: ServiceInstance,
  ttlMs: number,
): InstanceStatus => {
  const elapsed = Date.now() - instance.lastHeartbeatAt.getTime()
  if (elapsed < ttlMs / 2) return 'passing'
  if (elapsed < ttlMs)     return 'warning'
  return 'critical'
}

/**
 * Публичное представление инстанса (с производным status).
 */
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
