import Fastify from 'fastify';
import cors    from '@fastify/cors';
import helmet  from '@fastify/helmet';
import sensible from '@fastify/sensible';
import swagger   from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env } from '@config/index.js';
import { healthRoutes } from './routes/health.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level:     env.LOG_LEVEL,
      transport: env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
  });

  // Plugins
  await app.register(cors,    { origin: false });
  await app.register(helmet);
  await app.register(sensible);

  // OpenAPI
  await app.register(swagger, {
    openapi: {
      info: { title: 'MDM Core API', version: '0.1.0', description: 'Master Data Management Core' },
    },
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  // Routes
  await app.register(healthRoutes, { prefix: '/api/v1' });

  return app;
}
