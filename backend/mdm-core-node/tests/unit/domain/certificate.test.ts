/**
 * Сценарий: «Принимаем корневой сертификат» (регистрация устройства)
 * Сценарий: «Подтверждение устройства через signed nonce» (anti-spoofing)
 * Источник: docs/sysdes-interview.md
 */
import { describe, it, expect } from 'vitest';
import { Certificate } from '../../../src/domain/model/certificate.js';
import { CertificateFingerprint } from '../../../src/domain/model/value-objects.js';
import { newEntityId } from '../../../src/domain/model/entity.js';

// SHA-256 hex фингерпринт — 64 символа
const FP = 'a'.repeat(64);

const makeCert = (overrides: Partial<Parameters<typeof Certificate.issue>[0]> = {}) => {
  const fp = CertificateFingerprint.create(FP)._unsafeUnwrap();
  return Certificate.issue({
    deviceId: newEntityId(),
    type: 'device',
    subject: 'CN=device-001,O=RetailCorp',
    issuer: 'CN=RetailCorp-CA',
    fingerprint: fp,
    serialNumber: 'deadbeef01',
    pemEncoded: '-----BEGIN CERTIFICATE-----\nMIIBIjAN...\n-----END CERTIFICATE-----',
    issuedAt: new Date(),
    expiresAt: new Date(Date.now() + 365 * 24 * 3600_000),
    ...overrides,
  });
};

// ---------------------------------------------------------------------------
// Выпуск сертификата
// ---------------------------------------------------------------------------
describe('Выпуск device-сертификата (регистрация)', () => {
  it('новый сертификат имеет статус active', () => {
    const cert = makeCert();
    expect(cert.status).toBe('active');
    expect(cert.revokedAt).toBeNull();
    expect(cert.isValid()).toBe(true);
  });

  it('корневой CA-сертификат создаётся без deviceId', () => {
    // Сценарий: «Принимаем корневой сертификат» — он не привязан к устройству
    const cert = makeCert({ deviceId: null, type: 'ca' });
    expect(cert.deviceId).toBeNull();
    expect(cert.type).toBe('ca');
  });

  // Ошибка 2: сертификат невалиден — CertificateFingerprint отклоняет неправильный hash
  it('CertificateFingerprint отклоняет не-SHA256 строку', () => {
    const result = CertificateFingerprint.create('not-a-hash');
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('INVALID_FINGERPRINT');
  });

  it('CertificateFingerprint принимает корректный 64-символьный hex', () => {
    const result = CertificateFingerprint.create('b'.repeat(64));
    expect(result.isOk()).toBe(true);
  });

  it('CertificateFingerprint нормализуется к lowercase', () => {
    const fp = CertificateFingerprint.create('A'.repeat(64));
    expect(fp._unsafeUnwrap()).toBe('a'.repeat(64));
  });
});

// ---------------------------------------------------------------------------
// Anti-spoofing: сертификат подтверждает владение приватным ключом
// ---------------------------------------------------------------------------
describe('Anti-spoofing: проверка сертификата устройства', () => {
  it('два устройства с разными fingerprint не идентичны', () => {
    // Сценарий: «исключаем спуффинг серийного номера» — у каждого устройства уникальный fingerprint
    const fp1 = CertificateFingerprint.create('a'.repeat(64))._unsafeUnwrap();
    const fp2 = CertificateFingerprint.create('b'.repeat(64))._unsafeUnwrap();
    expect(fp1).not.toBe(fp2);
  });

  it('expired-сертификат не является valid (isValid = false)', () => {
    // Сценарий: nonce-проверка должна отклоняться при истёкшем сертификате
    const cert = makeCert({
      expiresAt: new Date(Date.now() - 1_000),
    });
    expect(cert.isExpired()).toBe(true);
    expect(cert.isValid()).toBe(false);
  });

  it('active-сертификат с будущим expiresAt — valid', () => {
    const cert = makeCert();
    expect(cert.isValid()).toBe(true);
    expect(cert.isExpired()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Отзыв сертификата
// ---------------------------------------------------------------------------
describe('Отзыв сертификата', () => {
  it('active сертификат успешно отзывается', () => {
    const cert   = makeCert();
    const result = cert.revoke();
    expect(result.isOk()).toBe(true);
    expect(cert.status).toBe('revoked');
    expect(cert.revokedAt).toBeInstanceOf(Date);
    expect(cert.isValid()).toBe(false);
  });

  it('повторный revoke возвращает ошибку CERTIFICATE_ALREADY_REVOKED', () => {
    const cert = makeCert();
    cert.revoke();
    const result = cert.revoke();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('CERTIFICATE_ALREADY_REVOKED');
  });

  it('expire() переводит active-сертификат в expired', () => {
    const cert   = makeCert();
    const result = cert.expire();
    expect(result.isOk()).toBe(true);
    expect(cert.status).toBe('expired');
  });

  it('нельзя expire уже отозванный сертификат', () => {
    const cert = makeCert();
    cert.revoke();
    const result = cert.expire();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('CERTIFICATE_NOT_ACTIVE');
  });
});
