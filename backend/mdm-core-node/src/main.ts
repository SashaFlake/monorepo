import 'reflect-metadata';
import './container/index.js';
import { buildApp } from './presentation/app.js';
import { env } from './config/index.js';

const app = await buildApp();

try {
  await app.listen({ port: env.PORT, host: env.HOST });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
