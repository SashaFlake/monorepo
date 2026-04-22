import { ok, err, type Result } from 'neverthrow'
import { randomUUID } from 'node:crypto'
import {
  type ServiceName,
  type InstanceId,
  type ServiceInstance,
  type ServiceInstanceView,
  type HealthCheckResult,
  serviceName,
  instanceId,
  toView,
} from '../domain/model.js'
import { registryError, type RegistryError } from '../domain/errors.js'

export type RegisterInput = {
  serviceName: string
  host:        string
  port:        number
  healthPath?: string
  metadata?:   Record<string, string>
}

export type RegisterOutput = {
  instanceId: InstanceId
}

export class RegistryService {
  private readonly store = new Map<ServiceName, Map<InstanceId, ServiceInstance>>()

  constructor(private readonly ttlMs: number) {}

  // ── Register ──────────────────────────────────────────────────────────────

  register(input: RegisterInput): Result<RegisterOutput, RegistryError> {
    const svcName = serviceName(input.serviceName)
    const id      = instanceId(randomUUID())
    const now     = new Date()

    const instance: ServiceInstance = {
      id,
      serviceName:     svcName,
      host:            input.host,
      port:            input.port,
      healthPath:      input.healthPath ?? '/health',
      metadata:        input.metadata ?? {},
      registeredAt:    now,
      lastHeartbeatAt: now,
      lastHealthCheck: null,
    }

    if (!this.store.has(svcName)) this.store.set(svcName, new Map())
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

  // ── Record health check result (вызывается из ActiveHealthChecker) ────────

  recordHealthCheck(
    id: string,
    result: Omit<HealthCheckResult, 'checkedAt'>,
  ): void {
    const iid = instanceId(id)
    for (const instances of this.store.values()) {
      const instance = instances.get(iid)
      if (instance) {
        instances.set(iid, {
          ...instance,
          lastHealthCheck: { ...result, checkedAt: new Date() },
        })
        return
      }
    }
  }

  // ── Deregister (явное действие) ───────────────────────────────────────────────
  //
  // Единственный способ удалить инстанс — автоматического удаления по TTL нет.
  // Инстанс без heartbeat переходит в warning/critical, но остаётся виден в мониторинге.
  // Удаление = грасефул шатдаун или явный шаг пайплайна деплоя.

  deregister(id: string): Result<void, RegistryError> {
    const iid = instanceId(id)
    for (const [svcName, instances] of this.store.entries()) {
      if (instances.has(iid)) {
        instances.delete(iid)
        if (instances.size === 0) this.store.delete(svcName)
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
    return ok([...instances.values()].map(i => toView(i, this.ttlMs)))
  }

  listServices(): Record<string, ServiceInstanceView[]> {
    const result: Record<string, ServiceInstanceView[]> = {}
    for (const [name, instances] of this.store.entries()) {
      result[name] = [...instances.values()].map(i => toView(i, this.ttlMs))
    }
    return result
  }

  // ── getAllInstances — нужен health checker-у ───────────────────────────────

  getAllInstances(): ServiceInstance[] {
    const all: ServiceInstance[] = []
    for (const instances of this.store.values()) {
      all.push(...instances.values())
    }
    return all
  }
}
