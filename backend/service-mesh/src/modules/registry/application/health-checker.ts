import type { RegistryService } from './registry.service.js'

/**
 * ActiveHealthChecker — независимо проверяет каждый инстанс.
 *
 * Каждые intervalMs делает GET http://host:port/healthPath.
 * Результат сохраняется в инстансе через registry.recordHealthCheck().
 *
 * Это критически важно: registry не доверяет самодиагностике сервиса
 * и сам убеждается что инстанс реально принимает запросы.
 */
export class ActiveHealthChecker {
  private timer: ReturnType<typeof setInterval> | null = null

  constructor(
    private readonly registry: RegistryService,
    private readonly intervalMs: number,
    private readonly timeoutMs: number,
    private readonly log: { info: (obj: object, msg: string) => void; warn: (obj: object, msg: string) => void },
  ) {}

  start(): void {
    this.timer = setInterval(() => void this.runChecks(), this.intervalMs)
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer)
  }

  private async runChecks(): Promise<void> {
    const instances = this.registry.getAllInstances()

    await Promise.allSettled(
      instances.map(instance => this.checkOne(
        instance.id,
        instance.host,
        instance.port,
        instance.healthPath,
      )),
    )
  }

  private async checkOne(
    id: string,
    host: string,
    port: number,
    healthPath: string,
  ): Promise<void> {
    const url = `http://${host}:${port}${healthPath}`
    const start = Date.now()
    let statusCode: number | null = null
    let ok = false

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

      try {
        const res = await fetch(url, { signal: controller.signal })
        statusCode = res.status
        ok = res.ok
      } finally {
        clearTimeout(timeout)
      }
    } catch {
      // сеть недоступна или таймаут — statusCode остаётся null, ok = false
    }

    const latencyMs = Date.now() - start

    this.registry.recordHealthCheck(id, { ok, statusCode, latencyMs })

    if (!ok) {
      this.log.warn({ id, url, statusCode, latencyMs }, 'Health check failed')
    }
  }
}
