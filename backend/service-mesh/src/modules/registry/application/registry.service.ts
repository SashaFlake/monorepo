import { ok, err, type Result } from 'neverthrow'
import { randomUUID } from 'node:crypto'
import {
  type ServiceId,
  type InstanceId,
  type Service,
  type Instance,
  type ServiceView,
  type InstanceView,
  type HealthCheckResult,
  type Labels,
  serviceId,
  instanceId,
  toServiceView,
  toInstanceView,
} from '../domain/model.js'
import { registryError, type RegistryError } from '../domain/errors.js'

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export type CreateServiceInput = {
  name:    string
  labels?: Labels
}

export type RegisterInstanceInput = {
  serviceId:  string
  host:       string
  port:       number
  healthPath?: string
  metadata?:  Record<string, string>
}

// ---------------------------------------------------------------------------
// RegistryService
// ---------------------------------------------------------------------------

export class RegistryService {
  private readonly services  = new Map<ServiceId, Service>()
  private readonly instances = new Map<InstanceId, Instance>()

  constructor(private readonly ttlMs: number) {}

  // ── Services ──────────────────────────────────────────────────────────────

  createService(input: CreateServiceInput): Result<ServiceView, RegistryError> {
    const id  = serviceId(randomUUID())
    const svc: Service = {
      id,
      name:         input.name,
      labels:       input.labels ?? {},
      registeredAt: new Date(),
    }
    this.services.set(id, svc)
    return ok(toServiceView(svc, [], this.ttlMs))
  }

  deleteService(id: string): Result<void, RegistryError> {
    const sid = serviceId(id)
    if (!this.services.has(sid)) {
      return err(registryError('SERVICE_NOT_FOUND', `Service ${id} not found`))
    }
    // удаляем все инстансы этого сервиса
    for (const [iid, instance] of this.instances.entries()) {
      if (instance.serviceId === sid) this.instances.delete(iid)
    }
    this.services.delete(sid)
    return ok(undefined)
  }

  getService(id: string): Result<ServiceView, RegistryError> {
    const sid = serviceId(id)
    const svc = this.services.get(sid)
    if (!svc) return err(registryError('SERVICE_NOT_FOUND', `Service ${id} not found`))
    return ok(toServiceView(svc, this.instancesOf(sid), this.ttlMs))
  }

  listServices(): ServiceView[] {
    return [...this.services.values()].map(svc =>
      toServiceView(svc, this.instancesOf(svc.id), this.ttlMs)
    )
  }

  // ── Instances ─────────────────────────────────────────────────────────────

  registerInstance(input: RegisterInstanceInput): Result<InstanceView, RegistryError> {
    const sid = serviceId(input.serviceId)
    if (!this.services.has(sid)) {
      return err(registryError('SERVICE_NOT_FOUND', `Service ${input.serviceId} not found`))
    }

    const id  = instanceId(randomUUID())
    const now = new Date()
    const instance: Instance = {
      id,
      serviceId:       sid,
      host:            input.host,
      port:            input.port,
      healthPath:      input.healthPath ?? '/health',
      metadata:        input.metadata ?? {},
      registeredAt:    now,
      lastHeartbeatAt: now,
      lastHealthCheck: null,
    }
    this.instances.set(id, instance)
    return ok(toInstanceView(instance, this.ttlMs))
  }

  heartbeat(id: string): Result<void, RegistryError> {
    const iid = instanceId(id)
    const instance = this.instances.get(iid)
    if (!instance) {
      return err(registryError('INSTANCE_NOT_FOUND', `Instance ${id} not found`))
    }
    this.instances.set(iid, { ...instance, lastHeartbeatAt: new Date() })
    return ok(undefined)
  }

  deregisterInstance(id: string): Result<void, RegistryError> {
    const iid = instanceId(id)
    if (!this.instances.has(iid)) {
      return err(registryError('INSTANCE_NOT_FOUND', `Instance ${id} not found`))
    }
    this.instances.delete(iid)
    return ok(undefined)
  }

  recordHealthCheck(
    id: string,
    result: Omit<HealthCheckResult, 'checkedAt'>,
  ): void {
    const iid = instanceId(id)
    const instance = this.instances.get(iid)
    if (instance) {
      this.instances.set(iid, {
        ...instance,
        lastHealthCheck: { ...result, checkedAt: new Date() },
      })
    }
  }

  getAllInstances(): Instance[] {
    return [...this.instances.values()]
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private instancesOf(sid: ServiceId): Instance[] {
    return [...this.instances.values()].filter(i => i.serviceId === sid)
  }
}
