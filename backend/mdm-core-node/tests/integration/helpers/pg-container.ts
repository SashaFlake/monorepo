/**
 * Shared PostgreSQL Testcontainer.
 *
 * Поднимается один раз на весь интеграционный прогон (globalSetup),
 * чтобы не пересоздавать контейнер для каждого теста.
 *
 * Использование:
 *   import { startPgContainer, stopPgContainer, getDatabaseUrl } from './pg-container.js';
 */
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';

let container: StartedPostgreSqlContainer | null = null;

export async function startPgContainer(): Promise<string> {
  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('mdm_test')
    .withUsername('mdm')
    .withPassword('mdm')
    .start();

  return container.getConnectionUri();
}

export async function stopPgContainer(): Promise<void> {
  await container?.stop();
  container = null;
}

export function getDatabaseUrl(): string {
  if (!container) throw new Error('PostgreSQL container is not started');
  return container.getConnectionUri();
}
