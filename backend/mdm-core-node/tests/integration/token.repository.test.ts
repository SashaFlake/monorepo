/**
 * Интеграционные тесты PrismaTokenRepository.
 * Поднимает реальный PostgreSQL через Testcontainers.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Token } from '@domain/model/token.js';
import type { TokenValue } from '@domain/model/value-objects.js';
import { newEntityId } from '@domain/model/entity.js';
import { startPgContainer, stopPgContainer, getDatabaseUrl } from './helpers/index.js';
import { createTestPrisma, cleanDatabase } from './helpers/index.js';
import type { TestPrismaContext } from './helpers/index.js';
import { PrismaTokenRepository } from '@infrastructure/persistence/prisma/repositories/token.repository.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeTokenValue = () => `tok_${newEntityId()}` as TokenValue;

const makeEnrollmentToken = (ttlSeconds?: number) =>
  Token.issue({
    value:   makeTokenValue(),
    purpose: 'enrollment',
    ...(ttlSeconds !== undefined && { ttlSeconds }),
  });

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
let ctx: TestPrismaContext;
let repo: PrismaTokenRepository;

beforeAll(async () => {
  const url = await startPgContainer();
  ctx  = await createTestPrisma(url);
  repo = new PrismaTokenRepository(ctx.prisma);
});

afterAll(async () => {
  await ctx.prisma.$disconnect();
  await stopPgContainer();
});

beforeEach(async () => {
  await cleanDatabase(ctx.prisma);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('PrismaTokenRepository', () => {
  describe('save / findById', () => {
    it('сохраняет токен и находит его по id', async () => {
      const token = makeEnrollmentToken();
      await repo.save(token);

      const result = await repo.findById(token.id);
      expect(result.isOk()).toBe(true);
      const found = result._unsafeUnwrap();
      expect(found).not.toBeNull();
      expect(found!.id).toBe(token.id);
      expect(found!.purpose).toBe('enrollment');
      expect(found!.status).toBe('active');
    });

    it('возвращает null если токен не найден', async () => {
      const result = await repo.findById(newEntityId());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeNull();
    });

    it('upsert обновляет токен (повторный save)', async () => {
      const token = makeEnrollmentToken();
      await repo.save(token);

      token.consume();
      await repo.save(token);

      const found = (await repo.findById(token.id))._unsafeUnwrap();
      expect(found!.status).toBe('used');
    });
  });

  describe('findByValue', () => {
    it('находит токен по value', async () => {
      const token = makeEnrollmentToken();
      await repo.save(token);

      const result = await repo.findByValue(token.value);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()?.id).toBe(token.id);
    });

    it('возвращает null для несуществующего value', async () => {
      const result = await repo.findByValue('nonexistent' as TokenValue);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeNull();
    });
  });

  describe('findActiveByPurpose', () => {
    it('находит только активные enrollment-токены', async () => {
      const active  = makeEnrollmentToken();
      const consumed = makeEnrollmentToken();
      await repo.save(active);
      await repo.save(consumed);

      consumed.consume();
      await repo.save(consumed);

      const result = await repo.findActiveByPurpose('enrollment');
      expect(result.isOk()).toBe(true);
      const ids = result._unsafeUnwrap().map(t => t.id);
      expect(ids).toContain(active.id);
      expect(ids).not.toContain(consumed.id);
    });
  });

  describe('delete', () => {
    it('удаляет токен', async () => {
      const token = makeEnrollmentToken();
      await repo.save(token);

      await repo.delete(token.id);

      const result = await repo.findById(token.id);
      expect(result._unsafeUnwrap()).toBeNull();
    });
  });
});
