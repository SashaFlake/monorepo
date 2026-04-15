/**
 * Создаёт PrismaClient подключённый к тестовому контейнеру
 * и применяет миграции через `prisma migrate deploy`.
 *
 * Использование в beforeAll/afterAll:
 *
 *   const ctx = await createTestPrisma(databaseUrl);
 *   // ...тесты...
 *   await ctx.prisma.$disconnect();
 */
import { PrismaClient } from '@prisma/client';
import { execSync } from 'node:child_process';

export interface TestPrismaContext {
  prisma: PrismaClient;
}

export async function createTestPrisma(databaseUrl: string): Promise<TestPrismaContext> {
  // Применяем миграции к свежей БД
  execSync('pnpm prisma migrate deploy', {
    env:   { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
  });

  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
    log: [],
  });

  await prisma.$connect();
  return { prisma };
}

/**
 * Очищает все таблицы между тестами (порядок важен из-за FK).
 */
export async function cleanDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction([
    prisma.certificate.deleteMany(),
    prisma.enrollment.deleteMany(),
    prisma.device.deleteMany(),
    prisma.token.deleteMany(),
    prisma.deviceGroup.deleteMany(),
    prisma.policy.deleteMany(),
  ]);
}
