/**
 * Сценарий: «Отдел закупок купил новое устройство и регистрирует его в системе»
 * Сценарий: «Устройство начинает enrollment»
 * Источник: docs/sysdes-interview.md
 */
import { describe, it, expect } from 'vitest';
import { Device } from '../../../src/domain/model/device.js';
import { DeviceSerialNumber, Udid } from '../../../src/domain/model/value-objects.js';
import { entityId, newEntityId } from '../../../src/domain/model/entity.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const sn  = (v = 'SN-SCAN-001') => DeviceSerialNumber.create(v)._unsafeUnwrap();
const uid = (v = 'UDID-ANDROID-SCANNER-001') => Udid.create(v)._unsafeUnwrap();

const makeDevice = (serialNumber = 'SN-SCAN-001') =>
  Device.create({
    serialNumber: sn(serialNumber),
    udid: uid(),
    platform: 'android',
    model: 'Honeywell CT47',
    osVersion: '13',
  });

// ---------------------------------------------------------------------------
// Регистрация нового устройства
// ---------------------------------------------------------------------------
describe('Регистрация нового устройства (закупки)', () => {
  it('новое устройство создаётся со статусом pending', () => {
    // Ожидаем: система готова к инициализации устройства
    const device = makeDevice();
    expect(device.status).toBe('pending');
    expect(device.enrolledAt).toBeNull();
    expect(device.groupId).toBeNull();
    expect(device.platform).toBe('android');
  });

  it('серийный номер устройства сохраняется корректно', () => {
    const device = makeDevice('SN-RETAIL-SCANNER-300000');
    expect(device.serialNumber).toBe('SN-RETAIL-SCANNER-300000');
  });

  // Ошибка 1: устройство уже зарегистрировано — серийный номер не уникальный
  it('value object DeviceSerialNumber отклоняет слишком короткий серийный номер', () => {
    const result = DeviceSerialNumber.create('AB');
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('INVALID_SERIAL_NUMBER');
  });

  it('value object DeviceSerialNumber нормализует к uppercase', () => {
    const result = DeviceSerialNumber.create('sn-lowercase-001');
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe('SN-LOWERCASE-001');
  });

  it('UDID отклоняется если короче 8 символов', () => {
    // Ошибка: невалидные данные устройства не должны попасть в систему
    const result = Udid.create('SHORT');
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('INVALID_UDID');
  });

  it('устройство не имеет lastSeenAt до первого обращения', () => {
    const device = makeDevice();
    expect(device.lastSeenAt).toBeNull();
  });

  it('recordSeen() фиксирует время последнего обращения', () => {
    const device = makeDevice();
    device.recordSeen();
    expect(device.lastSeenAt).toBeInstanceOf(Date);
  });
});

// ---------------------------------------------------------------------------
// Enrollment устройства
// ---------------------------------------------------------------------------
describe('Enrollment устройства', () => {
  it('устройство переходит в enrolled после успешного enrollment', () => {
    // Сценарий: присваиваем статус ENROLLED после подтверждения
    const device = makeDevice();
    const result = device.enroll();
    expect(result.isOk()).toBe(true);
    expect(device.status).toBe('enrolled');
    expect(device.enrolledAt).toBeInstanceOf(Date);
  });

  it('enrolledAt выставляется в момент enrollment', () => {
    const before = new Date();
    const device = makeDevice();
    device.enroll();
    const after = new Date();
    expect(device.enrolledAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(device.enrolledAt!.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  // Ошибка 4: статус не поменялся — повторный вызов enroll
  it('повторный enroll возвращает ошибку DEVICE_ALREADY_ENROLLED', () => {
    const device = makeDevice();
    device.enroll();
    const result = device.enroll();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('DEVICE_ALREADY_ENROLLED');
    // Статус остаётся enrolled — не сломался
    expect(device.status).toBe('enrolled');
  });

  it('pending-устройство нельзя unenroll — ошибка DEVICE_NOT_ENROLLED', () => {
    const device = makeDevice();
    const result = device.unenroll();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('DEVICE_NOT_ENROLLED');
  });

  it('enrolled-устройство успешно unenroll', () => {
    const device = makeDevice();
    device.enroll();
    const result = device.unenroll();
    expect(result.isOk()).toBe(true);
    expect(device.status).toBe('unenrolled');
  });

  // Событие по сценарию: enrollment — триггер для применения политик
  it('enroll() эмитирует DeviceEnrolledEvent', () => {
    const device = makeDevice();
    device.enroll();
    const events = device.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.eventType).toBe('device.enrolled');
    expect(events[0]?.aggregateId).toBe(device.id);
  });

  it('повторный pullEvents() возвращает пустой массив (события сняты)', () => {
    const device = makeDevice();
    device.enroll();
    device.pullEvents();
    expect(device.pullEvents()).toHaveLength(0);
  });

  // Назначение группы (для применения политик через DeviceGroup)
  it('assignGroup() привязывает устройство к группе и эмитирует событие', () => {
    const device = makeDevice();
    device.enroll();
    const gid = newEntityId();
    const result = device.assignGroup(gid);
    expect(result.isOk()).toBe(true);
    expect(device.groupId).toBe(gid);
    const events = device.pullEvents();
    // enrolled + group_assigned
    expect(events.some(e => e.eventType === 'device.group_assigned')).toBe(true);
  });

  it('wiped-устройство нельзя добавить в группу', () => {
    const device = Device.reconstitute({
      id: newEntityId(),
      serialNumber: sn(),
      udid: uid(),
      platform: 'android',
      model: 'Honeywell CT47',
      osVersion: '13',
      status: 'wiped',
      groupId: null,
      lastSeenAt: null,
      enrolledAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const result = device.assignGroup(newEntityId());
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('DEVICE_INACTIVE');
  });

  it('updateOs() обновляет версию ОС после OTA-обновления', () => {
    const device = makeDevice();
    device.enroll();
    device.updateOs('14');
    expect(device.osVersion).toBe('14');
  });
});
