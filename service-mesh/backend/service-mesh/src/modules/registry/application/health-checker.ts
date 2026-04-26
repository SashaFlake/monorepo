import type { RegistryService } from './registry.service.js'

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
    await Promise.allSettled(
      this.registry.getAllInstances().map(i =>
        this.checkOne(i.id, i.host, i.port, i.healthPath)
      )
    )
  }

  private async checkOne(
    id: string,
    host: string,
    port: number,
    healthPath: string,
  ): Promise<void> {
    const url   = `http://${host}:${port}${healthPath}`
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
    } catch { /* сеть недоступна или таймаут */ }

    const latencyMs = Date.now() - start
    this.registry.recordHealthCheck(id, { ok, statusCode, latencyMs })

    if (!ok) this.log.warn({ id, url, statusCode, latencyMs }, 'Health check failed')
  }
}
