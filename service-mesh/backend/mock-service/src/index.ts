import Fastify from 'fastify'

const app = Fastify({ logger: true })

// ── Config ───────────────────────────────────────────────────────────────────
const PORT         = Number(process.env.PORT          ?? 3001)
const HOST         = process.env.HOST                 ?? '0.0.0.0'
const SERVICE_NAME = process.env.SERVICE_NAME         ?? 'mock-service'
const SERVICE_HOST = process.env.SERVICE_HOST         ?? '127.0.0.1'
const REGISTRY_URL = process.env.REGISTRY_URL         ?? 'http://localhost:4000'
const HEARTBEAT_MS = Number(process.env.HEARTBEAT_MS  ?? 10_000)
const ENV_LABEL    = process.env.ENV_LABEL            ?? 'dev'
const VERSION      = process.env.VERSION              ?? '0.1.0'

// ── Business endpoint ────────────────────────────────────────────────────────
app.get('/hello-world', async () => ({
  message: 'Hello, World!',
  service: SERVICE_NAME,
  timestamp: new Date().toISOString(),
}))

app.get('/health', async () => ({ status: 'ok' }))

// ── Mesh registration ─────────────────────────────────────────────────────────
//
// Стратегия — upsert:
//   1. GET /services?name=<name>&labels=env=<env>,version=<ver>
//      — ищем свой сервис по name+labels
//   2. Если нашли — переиспользуем его ID
//      Если нет — POST /services (создать)
//   3. POST /instances — зарегистрировать этот конкретный инстанс
//
// При остановке: DELETE /instances/:id
// Сервис НЕ удаляется при остановке инстанса.

type ServiceView = { id: string; name: string }
type InstanceView = { id: string }

let serviceId:  string | null = null
let instanceId: string | null = null

async function ensureService(): Promise<string> {
  const labels = { env: ENV_LABEL, version: VERSION }
  const labelQuery = Object.entries(labels).map(([k, v]) => `${k}=${v}`).join(',')

  // сначала ищем существующий
  const searchRes = await fetch(
    `${REGISTRY_URL}/api/v1/services?name=${encodeURIComponent(SERVICE_NAME)}&labels=${encodeURIComponent(labelQuery)}`
  )
  if (searchRes.ok) {
    const found = await searchRes.json() as ServiceView[]
    if (found.length > 0) {
      app.log.info({ serviceId: found[0].id }, 'Found existing service, reusing')
      return found[0].id
    }
  }

  // не нашли — создаём
  const res = await fetch(`${REGISTRY_URL}/api/v1/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: SERVICE_NAME, labels }),
  })
  if (!res.ok) throw new Error(`Create service failed: ${res.status} ${await res.text()}`)
  const data = await res.json() as ServiceView
  app.log.info({ serviceId: data.id }, 'Created new service')
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
  const data = await res.json() as InstanceView
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

// ── Startup ──────────────────────────────────────────────────────────────────
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
