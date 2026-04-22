import { ok, err, type Result } from 'neverthrow'
import { randomUUID } from 'node:crypto'
import {
  type ServiceName,
  type InstanceId,
  type ServiceInstance,
  type ServiceInstanceView,
  serviceName,
  instanceId,
  toView,
} from '../domain/model.js'
import { registryError, type RegistryError } from '../domain/errors.js'

// ---------------------------------------------------------------------------
// DTOs (вход из presentation слоя)
// ---------------------------------------------------------------------------

export type RegisterInput = {
  serviceName: string
  host:        string
  port:        number
  metadata?:   Record<string, string>
}

export type RegisterOutput = {
  instanceId: InstanceId
}

// ---------------------------------------------------------------------------
// RegistryService — in-memory реализация
// Позже: заменить store на репозиторий с портом + адаптером (Redis / Postgres)
// ---------------------------------------------------------------------------

export class RegistryService {
  // Map<serviceName, Map<instanceId, instance>>
  private readonly store = new Map<ServiceName, Map<InstanceId, ServiceInstance>>()

  constructor(private readonly ttlMs: number) {}

  // ── Register ─────────────────────────────────────────────────────────────

  register(input: RegisterInput): Result<RegisterOutput, RegistryError> {
    const svcName = serviceName(input.serviceName)
    const id      = instanceId(randomUUID())
    const now     = new Date()

    const instance: ServiceInstance = {
      id,
      serviceName:     svcName,
      host:            input.host,
      port:            input.port,
      metadata:        input.metadata ?? {},
      registeredAt:    now,
      lastHeartbeatAt: now,
    }

    if (!this.store.has(svcName)) {
      this.store.set(svcName, new Map())
    }

    this.store.get(svcName)!.set(id, instance)

    return ok({ instanceId: id })
  }

  // ── Heartbeat ─────────────────────────────────────────────────────────────

  heartbeat(id: string): Result<void, RegistryError> {
    const iid = instanceId(id)

    for (const instances of this.store.values()) {
      const instance = instances.get(iid)
      if (instance) {
        instances.set(iid, { ...instance, lastHeartbeatAt: new Date() })
        return ok(undefined)
      }
    }

    return err(registryError('INSTANCE_NOT_FOUND', `Instance ${id} not found`))
  }

  // ── Deregister ────────────────────────────────────────────────────────────

  deregister(id: string): Result<void, RegistryError> {
    const iid = instanceId(id)

    for (const instances of this.store.values()) {
      if (instances.has(iid)) {
        instances.delete(iid)
        return ok(undefined)
      }
    }

    return err(registryError('INSTANCE_NOT_FOUND', `Instance ${id} not found`))
  }

  // ── Lookup ────────────────────────────────────────────────────────────────

  getService(name: string): Result<ServiceInstanceView[], RegistryError> {
    const svcName   = serviceName(name)
    const instances = this.store.get(svcName)

    if (!instances || instances.size === 0) {
      return err(registryError('SERVICE_NOT_FOUND', `Service "${name}" not found`))
    }

    const views = [...instances.values()].map((i) => toView(i, this.ttlMs))
    return ok(views)
  }

  // ── List all ──────────────────────────────────────────────────────────────

  listServices(): Record<string, ServiceInstanceView[]> {
    const result: Record<string, ServiceInstanceView[]> = {}

    for (const [name, instances] of this.store.entries()) {
      result[name] = [...instances.values()].map((i) => toView(i, this.ttlMs))
    }

    return result
  }

  // ── GC: удалить критические инстансы ─────────────────────────────────────

  purgeExpired(): number {
    let removed = 0
    const deadline = Date.now() - this.ttlMs

    for (const instances of this.store.values()) {
      for (const [id, instance] of instances.entries()) {
        if (instance.lastHeartbeatAt.getTime() < deadline) {
          instances.delete(id)
          removed++
        }
      }
    }

    return removed
  }
}
