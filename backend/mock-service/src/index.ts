import Fastify from 'fastify'

const app = Fastify({ logger: true })

// ── Config ────────────────────────────────────────────────────────────────────
const PORT         = Number(process.env.PORT          ?? 3001)
const HOST         = process.env.HOST                 ?? '0.0.0.0'
const SERVICE_NAME = process.env.SERVICE_NAME         ?? 'mock-service'
const SERVICE_HOST = process.env.SERVICE_HOST         ?? '127.0.0.1'
const REGISTRY_URL = process.env.REGISTRY_URL         ?? 'http://localhost:4000'
const HEARTBEAT_MS = Number(process.env.HEARTBEAT_MS  ?? 10_000)
const ENV_LABEL    = process.env.ENV_LABEL            ?? 'dev'
const VERSION      = process.env.VERSION              ?? '0.1.0'

// ── Business endpoint ─────────────────────────────────────────────────────────
app.get('/hello-world', async () => ({
  message: 'Hello, World!',
  service: SERVICE_NAME,
  timestamp: new Date().toISOString(),
}))

app.get('/health', async () => ({ status: 'ok' }))

// ── Mesh registration ─────────────────────────────────────────────────────────
//
// Модель: Service создаётся один раз, Instance — при каждом старте.
// При старте:
//   1. POST /services        — создать сервис (или использовать существующий если уже есть)
//   2. POST /instances       — зарегистрировать этот инстанс
// При остановке:
//   3. DELETE /instances/:id — дерегистрировать инстанс
//
// В реальном деплое Service создаётся пайплайном один раз.
// Здесь для простоты mock создаёт его сам при каждом старте.

let serviceId:  string | null = null
let instanceId: string | null = null

async function ensureService(): Promise<string> {
  const res = await fetch(`${REGISTRY_URL}/api/v1/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name:   SERVICE_NAME,
      labels: { env: ENV_LABEL, version: VERSION },
    }),
  })
  if (!res.ok) throw new Error(`Create service failed: ${res.status} ${await res.text()}`)
  const data = await res.json() as { id: string }
  return data.id
}

async function registerInstance(svcId: string): Promise<string> {
  const res = await fetch(`${REGISTRY_URL}/api/v1/instances`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      serviceId: svcId,
      host:      SERVICE_HOST,
      port:      PORT,
      metadata:  { version: VERSION },
    }),
  })
  if (!res.ok) throw new Error(`Register instance failed: ${res.status} ${await res.text()}`)
  const data = await res.json() as { id: string }
  return data.id
}

async function heartbeat(): Promise<void> {
  if (!instanceId) return
  const res = await fetch(`${REGISTRY_URL}/api/v1/instances/${instanceId}/heartbeat`, {
    method: 'PUT',
  })
  if (!res.ok) {
    app.log.warn({ status: res.status }, 'Heartbeat failed — re-registering instance')
    instanceId = null
    if (serviceId) instanceId = await registerInstance(serviceId)
  }
}

async function deregister(): Promise<void> {
  if (!instanceId) return
  await fetch(`${REGISTRY_URL}/api/v1/instances/${instanceId}`, { method: 'DELETE' })
  app.log.info({ instanceId }, 'Instance deregistered')
}

// ── Startup ───────────────────────────────────────────────────────────────────
await app.listen({ port: PORT, host: HOST })

for (let attempt = 1; attempt <= 10; attempt++) {
  try {
    serviceId  = await ensureService()
    instanceId = await registerInstance(serviceId)
    app.log.info({ serviceId, instanceId }, 'Registered in mesh')
    break
  } catch (err) {
    app.log.warn({ attempt, err }, 'Registry not ready, retrying...')
    await new Promise(r => setTimeout(r, attempt * 1000))
  }
}

const heartbeatTimer = setInterval(heartbeat, HEARTBEAT_MS)

// ── Graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = async (signal: string) => {
  app.log.info({ signal }, 'Shutting down')
  clearInterval(heartbeatTimer)
  await deregister()
  await app.close()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT',  () => shutdown('SIGINT'))
