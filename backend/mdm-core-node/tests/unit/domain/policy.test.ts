/**
 * Сценарий: «Накатываем политики безопасности и все требуемые действия»
 * Сценарий: Troubleshooting — «если не все необходимые политики применены — говорим обнови политики»
 * Источник: docs/sysdes-interview.md
 */
import { describe, it, expect } from 'vitest';
import { Policy } from '../../../src/domain/model/policy.js';
import type { PolicyType } from '../../../src/domain/model/policy.js';

const makePolicy = (
  type: PolicyType = 'passcode',
  overrides: Partial<Parameters<typeof Policy.create>[0]> = {},
) =>
  Policy.create({
    name: 'Android Passcode Policy',
    type,
    platforms: ['android'],
    rules: { minLength: 6, requireAlphanumeric: true },
    ...overrides,
  });

// ---------------------------------------------------------------------------
// Создание политики
// ---------------------------------------------------------------------------
describe('Создание политики безопасности', () => {
  it('новая политика создаётся в статусе draft, версия 1', () => {
    const result = makePolicy();
    expect(result.isOk()).toBe(true);
    const policy = result._unsafeUnwrap();
    expect(policy.status).toBe('draft');
    expect(policy.version).toBe(1);
  });

  it('политика требует хотя бы одну платформу', () => {
    // Устройства — только Android (сканеры)
    const result = Policy.create({ name: 'Bad', type: 'custom', platforms: [], rules: {} });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('POLICY_REQUIRES_PLATFORM');
  });

  it('имя политики не может быть пустым (< 2 символов)', () => {
    const result = Policy.create({ name: 'A', type: 'passcode', platforms: ['android'], rules: {} });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('INVALID_POLICY_NAME');
  });

  it('создаётся политика типа restriction для Android', () => {
    const result = makePolicy('restriction');
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().type).toBe('restriction');
  });

  it('политика хранит правила в виде произвольного JSON', () => {
    const rules = { minLength: 6, requireAlphanumeric: true, maxFailedAttempts: 10 };
    const policy = makePolicy('passcode', { rules })._unsafeUnwrap();
    expect(policy.rules).toEqual(rules);
  });
});

// ---------------------------------------------------------------------------
// Жизненный цикл: draft → active → archived
// ---------------------------------------------------------------------------
describe('Жизненный цикл политики', () => {
  it('draft-политику можно активировать', () => {
    // Сценарий: накатываем политики — они должны быть active
    const policy = makePolicy()._unsafeUnwrap();
    const result = policy.activate();
    expect(result.isOk()).toBe(true);
    expect(policy.status).toBe('active');
  });

  it('нельзя активировать уже active-политику — POLICY_NOT_DRAFT', () => {
    const policy = makePolicy()._unsafeUnwrap();
    policy.activate();
    const result = policy.activate();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('POLICY_NOT_DRAFT');
  });

  it('активную политику можно архивировать', () => {
    const policy = makePolicy()._unsafeUnwrap();
    policy.activate();
    const result = policy.archive();
    expect(result.isOk()).toBe(true);
    expect(policy.status).toBe('archived');
  });

  it('draft-политику можно архивировать напрямую', () => {
    const policy = makePolicy()._unsafeUnwrap();
    const result = policy.archive();
    expect(result.isOk()).toBe(true);
  });

  it('нельзя архивировать уже archived-политику', () => {
    const policy = makePolicy()._unsafeUnwrap();
    policy.archive();
    const result = policy.archive();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('POLICY_ALREADY_ARCHIVED');
  });
});

// ---------------------------------------------------------------------------
// Обновление правил (troubleshooting: клиент тянет актуальные политики)
// ---------------------------------------------------------------------------
describe('Обновление правил политики', () => {
  it('updateRules() увеличивает version — клиент определяет актуальность', () => {
    // Сценарий: «клиент инициирует pull политик» — версия позволяет проверить актуальность
    const policy = makePolicy()._unsafeUnwrap();
    policy.updateRules({ minLength: 8 });
    expect(policy.version).toBe(2);
    expect(policy.rules).toEqual({ minLength: 8 });
  });

  it('каждое updateRules() увеличивает version на 1', () => {
    const policy = makePolicy()._unsafeUnwrap();
    policy.updateRules({ minLength: 7 });
    policy.updateRules({ minLength: 8 });
    policy.updateRules({ minLength: 9 });
    expect(policy.version).toBe(4);
  });

  it('archived-политику нельзя обновить — POLICY_ARCHIVED', () => {
    // Сценарий: устройство запрашивает политику — archived не должна применяться
    const policy = makePolicy()._unsafeUnwrap();
    policy.archive();
    const result = policy.updateRules({ minLength: 4 });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('POLICY_ARCHIVED');
  });
});
