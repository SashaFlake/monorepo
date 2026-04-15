/**
 * Создаёт PrismaClient подключённый к тестовому контейнеру
 * и применяет схему через `prisma db push` (не требует migrations/).
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
  // db push применяет схему напрямую — не требует migrations/
  execSync('pnpm prisma db push --skip-generate --accept-data-loss', {
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
