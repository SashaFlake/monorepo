import Fastify from 'fastify'
import cors     from '@fastify/cors'
import sensible from '@fastify/sensible'
import { env } from '../config/env.js'
import { ZodTypeProvider, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { RegistryService }          from '../modules/registry/application/registry.service.js'
import { ActiveHealthChecker }      from '../modules/registry/application/health-checker.js'
import { RoutingRuleServiceImpl }   from '../modules/routing-rules/application/routing-rule.service.impl.js'
import { registryRoutes }           from '../modules/registry/presentation/routes.js'
import { routingRulesRoutes }       from '../modules/routing-rules/presentation/routes.js'

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport: env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
  }).withTypeProvider<ZodTypeProvider>()

  await app.register(cors,     { origin: true })
  await app.register(sensible)
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  const registry           = new RegistryService(env.INSTANCE_TTL_SECONDS * 1000)
  const routingRuleService = new RoutingRuleServiceImpl()

  // Active health checker — registry сам проверяет каждый инстанс
  // Интервал: 10 сек, таймаут на один запрос: 3 сек
  const healthChecker = new ActiveHealthChecker(
    registry,
    10_000,
    3_000,
    app.log,
  )
  healthChecker.start()

  // GC намеренно убран — инстансы живут до явного DELETE.
  // TTL влияет только на статус (passing → warning → critical),
  // но не удаляет запись из registry.

  await app.register(registryRoutes,     { prefix: '/api/v1', registry })
  await app.register(routingRulesRoutes, { prefix: '/api/v1', routingRuleService })

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  return app
}
