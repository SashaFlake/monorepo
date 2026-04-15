import type { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', { schema: { tags: ['system'] } }, async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));
};
