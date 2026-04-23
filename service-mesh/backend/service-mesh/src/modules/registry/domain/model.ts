// ---------------------------------------------------------------------------
// Registry — Domain Model
// Service и Instance — отдельные сущности.
//
// Service создаётся один раз (при деплое / вручную).
// Instance регистрируется при старте пода и живёт до явного DELETE.
// ---------------------------------------------------------------------------

export type ServiceId  = string & { readonly _brand: 'ServiceId' }
export type InstanceId = string & { readonly _brand: 'InstanceId' }

export const serviceId  = (v: string): ServiceId  => v as ServiceId
export const instanceId = (v: string): InstanceId => v as InstanceId

export type Labels = Record<string, string>

export type InstanceStatus = 'passing' | 'warning' | 'critical'

// ---------------------------------------------------------------------------
// HealthCheckResult
// ---------------------------------------------------------------------------

export type HealthCheckResult = {
  readonly checkedAt:  Date
  readonly ok:         boolean
  readonly statusCode: number | null
  readonly latencyMs:  number
}

// ---------------------------------------------------------------------------
// Service — корневая сущность
// Описывает логический сервис: имя, labels, селекторы.
// Не знает про конкретные хосты — это зона Instance.
// ---------------------------------------------------------------------------

export type Service = {
  readonly id:           ServiceId
  readonly name:         string
  readonly labels:       Labels       // { env: 'prod', version: '2', team: 'payments' }
  readonly registeredAt: Date
}

// ---------------------------------------------------------------------------
// Instance — конкретный запущенный экземпляр сервиса
// ---------------------------------------------------------------------------

export type Instance = {
  readonly id:              InstanceId
  readonly serviceId:       ServiceId
  readonly host:            string
  readonly port:            number
  readonly healthPath:      string
  readonly metadata:        Record<string, string>
  readonly registeredAt:    Date
  readonly lastHeartbeatAt: Date
  readonly lastHealthCheck: HealthCheckResult | null
}

// ---------------------------------------------------------------------------
// Status derivation (TTL + health check → worst-case)
// ---------------------------------------------------------------------------

export const deriveStatus = (
  instance: Instance,
  ttlMs: number,
): InstanceStatus => {
  const elapsed = Date.now() - instance.lastHeartbeatAt.getTime()
  const ttlStatus: InstanceStatus =
    elapsed < ttlMs / 2 ? 'passing' :
    elapsed < ttlMs     ? 'warning' :
    'critical'

  const hcStatus: InstanceStatus =
    instance.lastHealthCheck === null ? 'passing' :
    instance.lastHealthCheck.ok       ? 'passing' :
    'critical'

  if (ttlStatus === 'critical' || hcStatus === 'critical') return 'critical'
  if (ttlStatus === 'warning')                             return 'warning'
  return 'passing'
}

// ---------------------------------------------------------------------------
// Views (то что отдаём наружу)
// ---------------------------------------------------------------------------

export type InstanceView = Instance & {
  readonly status: InstanceStatus
}

export type ServiceView = Service & {
  readonly instances:     InstanceView[]
  readonly worstStatus:   InstanceStatus
}

export const toInstanceView = (
  instance: Instance,
  ttlMs: number,
): InstanceView => ({
  ...instance,
  status: deriveStatus(instance, ttlMs),
})

// worst-case статус по инстансам; нет инстансов = critical
export const worstStatus = (statuses: InstanceStatus[]): InstanceStatus => {
  if (statuses.length === 0)         return 'critical'
  if (statuses.includes('critical')) return 'critical'
  if (statuses.includes('warning'))  return 'warning'
  return 'passing'
}

export const toServiceView = (
  service: Service,
  instances: Instance[],
  ttlMs: number,
): ServiceView => {
  const views = instances.map(i => toInstanceView(i, ttlMs))
  return {
    ...service,
    instances:   views,
    worstStatus: worstStatus(views.map(v => v.status)),
  }
}
