/**
 * Сценарий: «Устройство начинает enrollment»
 * Сценарий: Troubleshooting — «Если enrollment прервался, то требуется ручной перезапуск»
 * Источник: docs/sysdes-interview.md
 */
import { describe, it, expect } from 'vitest';
import { Enrollment } from '../../../src/domain/model/enrollment.js';
import { newEntityId } from '../../../src/domain/model/entity.js';

const makeEnrollment = (ttlSeconds = 3 * 24 * 3600 /* 72ч */) =>
  Enrollment.initiate({
    tokenId: newEntityId(),
    platform: 'android',
    ttlSeconds,
  });

const makeExpiredEnrollment = () =>
  Enrollment.reconstitute({
    id: newEntityId(),
    deviceId: null,
    tokenId: newEntityId(),
    platform: 'android',
    status: 'initiated',
    failureReason: null,
    initiatedAt: new Date(Date.now() - 73 * 3600_000),
    completedAt: null,
    expiresAt: new Date(Date.now() - 1_000), // истёк
    updatedAt: new Date(),
  });

// ---------------------------------------------------------------------------
// Инициализация enrollment
// ---------------------------------------------------------------------------
describe('Инициализация enrollment', () => {
  it('enrollment создаётся со статусом initiated', () => {
    const enrollment = makeEnrollment();
    expect(enrollment.status).toBe('initiated');
    expect(enrollment.deviceId).toBeNull();
    expect(enrollment.completedAt).toBeNull();
  });

  it('TTL enrollment по умолчанию 72 часа (бизнес-параметр)', () => {
    const enrollment = makeEnrollment();
    const diffHours = (enrollment.expiresAt.getTime() - Date.now()) / 3600_000;
    // 72 ч с допуском 1 с
    expect(diffHours).toBeGreaterThanOrEqual(71.999);
    expect(diffHours).toBeLessThanOrEqual(72.001);
  });

  it('isExpired() возвращает false для свежего enrollment', () => {
    expect(makeEnrollment().isExpired()).toBe(false);
  });

  it('isExpired() возвращает true если TTL истёк', () => {
    expect(makeExpiredEnrollment().isExpired()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Успешное завершение enrollment
// ---------------------------------------------------------------------------
describe('Завершение enrollment', () => {
  it('complete() переводит enrollment в completed и привязывает deviceId', () => {
    // Сценарий: присваиваем статус ENROLLED устройству
    const enrollment = makeEnrollment();
    const deviceId   = newEntityId();
    const result     = enrollment.complete(deviceId);
    expect(result.isOk()).toBe(true);
    expect(enrollment.status).toBe('completed');
    expect(enrollment.deviceId).toBe(deviceId);
    expect(enrollment.completedAt).toBeInstanceOf(Date);
  });

  it('complete() эмитирует EnrollmentCompletedEvent с deviceId', () => {
    const enrollment = makeEnrollment();
    const deviceId   = newEntityId();
    enrollment.complete(deviceId);
    const events = enrollment.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.eventType).toBe('enrollment.completed');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((events[0] as any).deviceId).toBe(deviceId);
  });

  // Ошибка 4: статус не поменялся — повторный complete
  it('завершённый enrollment нельзя complete повторно', () => {
    const enrollment = makeEnrollment();
    enrollment.complete(newEntityId());
    const result = enrollment.complete(newEntityId());
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('ENROLLMENT_NOT_INITIATED');
  });

  // Ошибка 1: токен невалидный (истёк)
  it('нельзя завершить enrollment с истёкшим токеном', () => {
    const expired = makeExpiredEnrollment();
    const result  = expired.complete(newEntityId());
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('ENROLLMENT_TOKEN_EXPIRED');
  });
});

// ---------------------------------------------------------------------------
// Прерывание enrollment (troubleshooting: ручной перезапуск)
// ---------------------------------------------------------------------------
describe('Прерванный enrollment', () => {
  it('fail() фиксирует причину ошибки и статус failed', () => {
    // Сценарий: enrollment прервался — требуется ручной перезапуск
    const enrollment = makeEnrollment();
    const result = enrollment.fail('Certificate validation failed');
    expect(result.isOk()).toBe(true);
    expect(enrollment.status).toBe('failed');
    expect(enrollment.failureReason).toBe('Certificate validation failed');
  });

  it('завершённый enrollment нельзя перевести в failed', () => {
    const enrollment = makeEnrollment();
    enrollment.complete(newEntityId());
    const result = enrollment.fail('late error');
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('ENROLLMENT_CANNOT_FAIL');
  });
});

// ---------------------------------------------------------------------------
// Отзыв enrollment (администратор)
// ---------------------------------------------------------------------------
describe('Отзыв enrollment', () => {
  it('активный enrollment можно отозвать', () => {
    const enrollment = makeEnrollment();
    const result = enrollment.revoke();
    expect(result.isOk()).toBe(true);
    expect(enrollment.status).toBe('revoked');
  });

  it('revoke() эмитирует EnrollmentRevokedEvent', () => {
    const enrollment = makeEnrollment();
    enrollment.revoke();
    const events = enrollment.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.eventType).toBe('enrollment.revoked');
  });

  it('завершённый enrollment нельзя отозвать', () => {
    const enrollment = makeEnrollment();
    enrollment.complete(newEntityId());
    const result = enrollment.revoke();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('ENROLLMENT_CANNOT_REVOKE');
  });

  it('отозванный enrollment нельзя отозвать повторно', () => {
    const enrollment = makeEnrollment();
    enrollment.revoke();
    const result = enrollment.revoke();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('ENROLLMENT_CANNOT_REVOKE');
  });
});
