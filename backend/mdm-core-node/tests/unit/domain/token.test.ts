/**
 * Сценарий: «Выпускаем одноразовый токен привязанный к серийному номеру»
 * Сценарий: Troubleshooting — TTL enrollment токена (дефолт 72ч)
 * Источник: docs/sysdes-interview.md
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { Token } from '../../../src/domain/model/token.js';
import { TokenValue } from '../../../src/domain/model/value-objects.js';
import { newEntityId } from '../../../src/domain/model/entity.js';

const makeVal = (len = 48) => TokenValue.create('x'.repeat(len))._unsafeUnwrap();

const makeEnrollmentToken = (ttlSeconds?: number) =>
  Token.issue({ value: makeVal(), purpose: 'enrollment', ...(ttlSeconds !== undefined && { ttlSeconds }) });

const makeApiToken = () =>
  Token.issue({ value: makeVal(), purpose: 'api' });

// ---------------------------------------------------------------------------
// Выпуск токена
// ---------------------------------------------------------------------------
describe('Выпуск enrollment-токена', () => {
  it('новый токен имеет статус active', () => {
    const token = makeEnrollmentToken();
    expect(token.status).toBe('active');
    expect(token.isValid()).toBe(true);
  });

  // TTL = 72 ч (дефолт из sysdes-interview: «день упаковка, день доставка, день на активацию»)
  it('дефолтный TTL enrollment-токена равен 72 часам', () => {
    const before = Date.now();
    const token = Token.issue({ value: makeVal(), purpose: 'enrollment' });
    const expectedExpiry = before + 72 * 60 * 60 * 1000;
    // Допуск 1 с на выполнение теста
    expect(token.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedExpiry - 1000);
    expect(token.expiresAt.getTime()).toBeLessThanOrEqual(expectedExpiry + 1000);
  });

  it('TTL токена можно переопределить (бизнес-параметр)', () => {
    const ttl = 48 * 3600; // 48 ч
    const token = makeEnrollmentToken(ttl);
    const expectedExpiry = Date.now() + ttl * 1000;
    expect(token.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedExpiry - 1000);
  });

  it('API-токен живёт 365 дней по умолчанию', () => {
    const token = makeApiToken();
    const diff = token.expiresAt.getTime() - Date.now();
    expect(diff).toBeGreaterThan(364 * 24 * 3600 * 1000);
  });

  // Ошибка 3: токен не выпустился — TokenValue слишком короткий
  it('TokenValue отклоняется если короче 32 символов', () => {
    const result = TokenValue.create('short');
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('INVALID_TOKEN_VALUE');
  });

  it('токен привязывается к серийному номеру через issuedToId', () => {
    const deviceId = newEntityId();
    const token = Token.issue({ value: makeVal(), purpose: 'enrollment', issuedToId: deviceId });
    expect(token.issuedToId).toBe(deviceId);
  });
});

// ---------------------------------------------------------------------------
// Одноразовое потребление токена
// ---------------------------------------------------------------------------
describe('Потребление enrollment-токена при enrollment', () => {
  it('consume() переводит токен в used и фиксирует usedAt', () => {
    const token = makeEnrollmentToken();
    const result = token.consume();
    expect(result.isOk()).toBe(true);
    expect(token.status).toBe('used');
    expect(token.usedAt).toBeInstanceOf(Date);
  });

  // Ошибка 1: токен невалидный — попытка повторного использования
  it('использованный токен нельзя использовать повторно', () => {
    const token = makeEnrollmentToken();
    token.consume();
    const result = token.consume();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('TOKEN_NOT_ACTIVE');
  });

  it('API-токен нельзя consume — он не одноразовый', () => {
    const token = makeApiToken();
    const result = token.consume();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('TOKEN_NOT_CONSUMABLE');
  });

  it('просроченный токен нельзя использовать — TOKEN_EXPIRED', () => {
    // Симулируем просроченный токен через reconstitute
    const expired = Token.reconstitute({
      id: newEntityId(),
      value: makeVal(),
      purpose: 'enrollment',
      status: 'active',
      issuedToId: null,
      usedAt: null,
      revokedAt: null,
      issuedAt: new Date(Date.now() - 73 * 3600_000),
      expiresAt: new Date(Date.now() - 1_000), // истёк 1 с назад
      updatedAt: new Date(),
    });
    expect(expired.isExpired()).toBe(true);
    expect(expired.isValid()).toBe(false);
    const result = expired.consume();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('TOKEN_EXPIRED');
  });
});

// ---------------------------------------------------------------------------
// Отзыв токена
// ---------------------------------------------------------------------------
describe('Отзыв токена (revoke)', () => {
  it('активный токен можно отозвать', () => {
    const token = makeEnrollmentToken();
    const result = token.revoke();
    expect(result.isOk()).toBe(true);
    expect(token.status).toBe('revoked');
    expect(token.revokedAt).toBeInstanceOf(Date);
  });

  it('отозванный токен нельзя отозвать повторно', () => {
    const token = makeEnrollmentToken();
    token.revoke();
    const result = token.revoke();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('TOKEN_CANNOT_REVOKE');
  });

  it('использованный токен нельзя отозвать', () => {
    const token = makeEnrollmentToken();
    token.consume();
    const result = token.revoke();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('TOKEN_CANNOT_REVOKE');
  });

  it('isValid() возвращает false для отозванного токена', () => {
    const token = makeEnrollmentToken();
    token.revoke();
    expect(token.isValid()).toBe(false);
  });
});
