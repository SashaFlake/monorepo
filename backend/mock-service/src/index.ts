import Fastify from 'fastify'

const app = Fastify({ logger: true })

// ── Config ──────────────────────────────────────────────────────────────────
const PORT          = Number(process.env.PORT          ?? 3001)
const HOST          = process.env.HOST                 ?? '0.0.0.0'
const SERVICE_NAME  = process.env.SERVICE_NAME         ?? 'mock-service'
const SERVICE_HOST  = process.env.SERVICE_HOST         ?? '127.0.0.1'
const REGISTRY_URL  = process.env.REGISTRY_URL         ?? 'http://localhost:4000'
const HEARTBEAT_MS  = Number(process.env.HEARTBEAT_MS  ?? 10_000)  // < TTL/2 (30s)

// ── Business endpoint ────────────────────────────────────────────────────────
app.get('/hello-world', async () => ({
  message: 'Hello, World!',
  service: SERVICE_NAME,
  timestamp: new Date().toISOString(),
}))

app.get('/health', async () => ({ status: 'ok' }))

// ── Mesh registration ────────────────────────────────────────────────────────
let instanceId: string | null = null

async function register(): Promise<void> {
  const res = await fetch(`${REGISTRY_URL}/api/v1/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      serviceName: SERVICE_NAME,
      host:        SERVICE_HOST,
      port:        PORT,
      metadata:    { version: '0.1.0' },
    }),
  })

  if (!res.ok) {
    throw new Error(`Registry register failed: ${res.status} ${await res.text()}`)
  }

  const data = await res.json() as { id: string }
  instanceId = data.id
  app.log.info({ instanceId }, 'Registered in mesh')
}

async function heartbeat(): Promise<void> {
  if (!instanceId) return
  const res = await fetch(`${REGISTRY_URL}/api/v1/instances/${instanceId}/heartbeat`, {
    method: 'PUT',
  })
  if (!res.ok) {
    app.log.warn({ status: res.status }, 'Heartbeat failed — re-registering')
    instanceId = null
    await register()
  }
}

async function deregister(): Promise<void> {
  if (!instanceId) return
  await fetch(`${REGISTRY_URL}/api/v1/instances/${instanceId}`, { method: 'DELETE' })
  app.log.info({ instanceId }, 'Deregistered from mesh')
}

// ── Startup ──────────────────────────────────────────────────────────────────
await app.listen({ port: PORT, host: HOST })

// Пробуем зарегистрироваться, retry с backoff если registry ещё не готов
for (let attempt = 1; attempt <= 10; attempt++) {
  try {
    await register()
    break
  } catch (err) {
    app.log.warn({ attempt, err }, 'Registry not ready, retrying...')
    await new Promise(r => setTimeout(r, attempt * 1000))
  }
}

// Heartbeat loop
const heartbeatTimer = setInterval(heartbeat, HEARTBEAT_MS)

// ── Graceful shutdown ────────────────────────────────────────────────────────
const shutdown = async (signal: string) => {
  app.log.info({ signal }, 'Shutting down')
  clearInterval(heartbeatTimer)
  await deregister()
  await app.close()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT',  () => shutdown('SIGINT'))
