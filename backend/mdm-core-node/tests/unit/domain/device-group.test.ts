/**
 * Сценарий: управление группами устройств и привязка политик
 * Контекст: 300 000 устройств разбиты на группы (магазины/регионы)
 * Источник: docs/sysdes-interview.md
 */
import { describe, it, expect } from 'vitest';
import { DeviceGroup } from '../../../src/domain/model/device-group.js';
import { newEntityId } from '../../../src/domain/model/entity.js';

const makeGroup = (name = 'Регион Москва') => DeviceGroup.create({ name })._unsafeUnwrap();

// ---------------------------------------------------------------------------
// Создание группы
// ---------------------------------------------------------------------------
describe('Создание группы устройств', () => {
  it('группа создаётся с пустым списком политик', () => {
    const group = makeGroup();
    expect(group.name).toBe('Регион Москва');
    expect(group.policyIds).toHaveLength(0);
  });

  it('имя группы не может быть короче 2 символов', () => {
    const result = DeviceGroup.create({ name: 'X' });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('INVALID_GROUP_NAME');
  });

  it('имя группы trimming работает', () => {
    const group = DeviceGroup.create({ name: '  Склад Урал  ' })._unsafeUnwrap();
    expect(group.name).toBe('Склад Урал');
  });
});

// ---------------------------------------------------------------------------
// Привязка политик к группе
// ---------------------------------------------------------------------------
describe('Привязка политик к группе (policy assignment)', () => {
  it('политику можно привязать к группе', () => {
    // Сценарий: накатываем политики через группу устройств
    const group    = makeGroup();
    const policyId = newEntityId();
    const result   = group.attachPolicy(policyId);
    expect(result.isOk()).toBe(true);
    expect(group.policyIds).toContain(policyId);
  });

  it('одну политику нельзя привязать дважды — POLICY_ALREADY_ATTACHED', () => {
    const group    = makeGroup();
    const policyId = newEntityId();
    group.attachPolicy(policyId);
    const result = group.attachPolicy(policyId);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('POLICY_ALREADY_ATTACHED');
  });

  it('к группе можно привязать несколько политик', () => {
    const group = makeGroup();
    group.attachPolicy(newEntityId());
    group.attachPolicy(newEntityId());
    group.attachPolicy(newEntityId());
    expect(group.policyIds).toHaveLength(3);
  });

  it('политику можно отвязать от группы', () => {
    const group    = makeGroup();
    const policyId = newEntityId();
    group.attachPolicy(policyId);
    const result = group.detachPolicy(policyId);
    expect(result.isOk()).toBe(true);
    expect(group.policyIds).not.toContain(policyId);
  });

  it('нельзя отвязать политику, которая не привязана — POLICY_NOT_ATTACHED', () => {
    const group  = makeGroup();
    const result = group.detachPolicy(newEntityId());
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('POLICY_NOT_ATTACHED');
  });

  it('policyIds возвращает копию — мутация снаружи не влияет на агрегат', () => {
    const group    = makeGroup();
    const policyId = newEntityId();
    group.attachPolicy(policyId);
    const ids = group.policyIds;
    ids.push(newEntityId()); // мутируем снаружи
    expect(group.policyIds).toHaveLength(1); // агрегат не изменился
  });
});

// ---------------------------------------------------------------------------
// Переименование группы
// ---------------------------------------------------------------------------
describe('Управление группой', () => {
  it('группу можно переименовать', () => {
    const group  = makeGroup();
    const result = group.rename('Регион Дальний Восток');
    expect(result.isOk()).toBe(true);
    expect(group.name).toBe('Регион Дальний Восток');
  });

  it('rename с пустым именем возвращает ошибку', () => {
    const group  = makeGroup();
    const result = group.rename('X');
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('INVALID_GROUP_NAME');
  });
});
