/**
 * Сценарии жизненного цикла устройства:
 *
 * 1. Отдел закупок регистрирует устройство вручную → статус `pending`.
 * 2. Пользователь вводит токен, инициирует enrollment.
 * 3. MDM высылает nonce для подтверждения сертификата устройства.
 * 4. Устройство подписывает nonce своим сертификатом → MDM валидирует signed nonce.
 * 5. Устройство переходит в `enrolling` (сертификат подтверждён, исключён spoofing).
 * 6. Накатываются политики безопасности и другие действия.
 * 7. Устройство переходит в `enrolled` — может получать доступ к ресурсам компании.
 */
import { describe, it, expect } from 'vitest';
import { Device } from '../../../src/domain/model/device.js';
import { DeviceSerialNumber, Udid } from '../../../src/domain/model/value-objects.js';
import { newEntityId } from '../../../src/domain/model/entity.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const sn  = (v = 'SN-SCAN-001')          => DeviceSerialNumber.create(v)._unsafeUnwrap();
const uid = (v = 'UDID-ANDROID-SCANNER-001') => Udid.create(v)._unsafeUnwrap();

const makeDevice = (serialNumber = 'SN-SCAN-001') =>
  Device.create({
    serialNumber: sn(serialNumber),
    udid:         uid(),
    platform:     'android',
    model:        'Honeywell CT47',
    osVersion:    '13',
  });

// ---------------------------------------------------------------------------
// Сценарий 1: Ручная регистрация устройства (отдел закупок)
// ---------------------------------------------------------------------------
describe('Регистрация нового устройства', () => {
  it('новое устройство создаётся со статусом pending', () => {
    const device = makeDevice();
    expect(device.status).toBe('pending');
    expect(device.enrolledAt).toBeNull();
    expect(device.groupId).toBeNull();
    expect(device.platform).toBe('android');
  });

  it('серийный номер сохраняется корректно', () => {
    const device = makeDevice('SN-RETAIL-SCANNER-300000');
    expect(device.serialNumber).toBe('SN-RETAIL-SCANNER-300000');
  });

  it('DeviceSerialNumber отклоняет слишком короткий серийный номер', () => {
    const result = DeviceSerialNumber.create('AB');
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('INVALID_SERIAL_NUMBER');
  });

  it('DeviceSerialNumber нормализует к uppercase', () => {
    expect(DeviceSerialNumber.create('sn-lowercase-001')._unsafeUnwrap()).toBe('SN-LOWERCASE-001');
  });

  it('UDID отклоняется если короче 8 символов', () => {
    const result = Udid.create('SHORT');
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('INVALID_UDID');
  });

  it('устройство не имеет lastSeenAt до первого обращения', () => {
    expect(makeDevice().lastSeenAt).toBeNull();
  });

  it('recordSeen() фиксирует время последнего обращения', () => {
    const device = makeDevice();
    device.recordSeen();
    expect(device.lastSeenAt).toBeInstanceOf(Date);
  });
});

// ---------------------------------------------------------------------------
// Сценарий 2: Enrollment с подтверждением сертификата
// ---------------------------------------------------------------------------
describe('Enrollment устройства', () => {

  // --- Шаг 3–04: подтверждение сертификата (nonce → signed nonce) ---

  it('после валидации сертификата устройство переходит в enrolling', () => {
    // Симулируем: MDM проверил signed nonce — spoofing исключён,
    // домен фиксирует начало применения политик.
    const device = makeDevice();
    const result = device.beginEnrollment();
    expect(result.isOk()).toBe(true);
    expect(device.status).toBe('enrolling');
    expect(device.enrolledAt).toBeNull(); // ещё не enrolled
  });

  it('beginEnrollment() эмитирует device.enrollment_started', () => {
    const device = makeDevice();
    device.beginEnrollment();
    const events = device.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.eventType).toBe('device.enrollment_started');
    expect(events[0]?.aggregateId).toBe(device.id);
  });

  it('нельзя начать enrollment не с pending (напр. уже enrolling)', () => {
    const device = makeDevice();
    device.beginEnrollment();
    const second = device.beginEnrollment();
    expect(second.isErr()).toBe(true);
    expect(second._unsafeUnwrapErr().code).toBe('DEVICE_INVALID_STATE');
  });

  it('нельзя начать enrollment для enrolled устройства (защита от re-enrollment)', () => {
    const device = makeDevice();
    device.beginEnrollment();
    device.completeEnrollment();
    const result = device.beginEnrollment();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('DEVICE_INVALID_STATE');
  });

  // --- Шаг 5–07: применение политик → enrolled ---

  it('после применения политик устройство переходит в enrolled', () => {
    // Симулируем: политики применены — фиксируем результат.
    const device = makeDevice();
    device.beginEnrollment();
    const result = device.completeEnrollment();
    expect(result.isOk()).toBe(true);
    expect(device.status).toBe('enrolled');
    expect(device.enrolledAt).toBeInstanceOf(Date);
  });

  it('completeEnrollment() эмитирует device.enrolled', () => {
    const device = makeDevice();
    device.beginEnrollment();
    device.completeEnrollment();
    const events = device.pullEvents();
    // Оба события: enrollment_started + enrolled
    expect(events.some(e => e.eventType === 'device.enrollment_started')).toBe(true);
    expect(events.some(e => e.eventType === 'device.enrolled')).toBe(true);
  });

  it('enrolledAt выставляется в момент completeEnrollment()', () => {
    const before = new Date();
    const device  = makeDevice();
    device.beginEnrollment();
    device.completeEnrollment();
    const after = new Date();
    expect(device.enrolledAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(device.enrolledAt!.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('completeEnrollment() без beginEnrollment() — ошибка DEVICE_INVALID_STATE', () => {
    // Защита: нельзя завершить enrollment без подтверждения сертификата
    const device = makeDevice();
    const result = device.completeEnrollment();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('DEVICE_INVALID_STATE');
  });

  it('pullEvents() очищает очередь событий', () => {
    const device = makeDevice();
    device.beginEnrollment();
    device.completeEnrollment();
    device.pullEvents();
    expect(device.pullEvents()).toHaveLength(0);
  });

  // --- После enrolled: доступ к ресурсам ---

  it('enrolled-устройство можно добавить в группу и получить доступ к ресурсам', () => {
    const device = makeDevice();
    device.beginEnrollment();
    device.completeEnrollment();
    const gid = newEntityId();
    const result = device.assignGroup(gid);
    expect(result.isOk()).toBe(true);
    expect(device.groupId).toBe(gid);
    const events = device.pullEvents();
    expect(events.some(e => e.eventType === 'device.group_assigned')).toBe(true);
  });

  it('unenroll() возвращает ошибку если статус не enrolled', () => {
    const device = makeDevice();
    const result = device.unenroll();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('DEVICE_NOT_ENROLLED');
  });

  it('enrolled-устройство успешно unenroll', () => {
    const device = makeDevice();
    device.beginEnrollment();
    device.completeEnrollment();
    const result = device.unenroll();
    expect(result.isOk()).toBe(true);
    expect(device.status).toBe('unenrolled');
  });

  it('wiped-устройство нельзя добавить в группу', () => {
    const device = Device.reconstitute({
      id:           newEntityId(),
      serialNumber: sn(),
      udid:         uid(),
      platform:     'android',
      model:        'Honeywell CT47',
      osVersion:    '13',
      status:       'wiped',
      groupId:      null,
      lastSeenAt:   null,
      enrolledAt:   new Date(),
      createdAt:    new Date(),
      updatedAt:    new Date(),
    });
    const result = device.assignGroup(newEntityId());
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('DEVICE_INACTIVE');
  });

  it('updateOs() обновляет версию ОС после OTA', () => {
    const device = makeDevice();
    device.beginEnrollment();
    device.completeEnrollment();
    device.updateOs('14');
    expect(device.osVersion).toBe('14');
  });
});
