import Fastify from 'fastify'
import cors     from '@fastify/cors'
import sensible from '@fastify/sensible'
import { env } from '../config/env.js'
import { RegistryService } from '../modules/registry/application/registry.service.js'
import { registryRoutes }  from '../modules/registry/presentation/routes.js'

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport: env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
  })

  await app.register(cors,     { origin: true })
  await app.register(sensible)

  // Composition root — создаём сервисы здесь
  // Позже: вынести в container/index.ts как в mdm-core-node
  const registry = new RegistryService(env.INSTANCE_TTL_SECONDS * 1000)

  // GC: чистим expired инстансы каждые 10 секунд
  setInterval(() => {
    const removed = registry.purgeExpired()
    if (removed > 0) {
      app.log.info({ removed }, 'Purged expired instances')
    }
  }, 10_000)

  // Routes
  await app.register(registryRoutes, { prefix: '/api/v1', registry })

  // Health
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  return app
}
