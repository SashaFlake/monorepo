/**
 * Unit-тесты RequestEnrollmentHandler.
 *
 * Все зависимости заменены vi (vi.fn / vi.spyOn) — никакой БД не нужно.
 */
import { describe, it, expect, vi } from 'vitest';
import { ok, err } from 'neverthrow';
import { RequestEnrollmentHandler } from '../../../src/application/command-handler/enrollment/request-enrollment.handler.js';
import { requestEnrollment } from '../../../src/application/command-handler/enrollment/request-enrollment.command.js';
import { Device } from '../../../src/domain/model/device.js';
import { Token } from '../../../src/domain/model/token.js';
import { DeviceSerialNumber, Udid, TokenValue } from '../../../src/domain/model/value-objects.js';
import { newEntityId } from '../../../src/domain/model/entity.js';
import { domainError } from '../../../src/domain/error/domain-error.js';
import type { DeviceRepositoryPort } from '../../../src/domain/port/device.repository.port.js';
import type { TokenRepositoryPort } from '../../../src/domain/port/token.repository.port.js';
import type { NonceGeneratorPort } from '../../../src/domain/port/nonce.generator.port.js';

// ---------------------------------------------------------------------------
// Фабрики
// ---------------------------------------------------------------------------
const makePendingDevice = () =>
  Device.create({
    serialNumber: DeviceSerialNumber.create('SN-SCAN-001')._unsafeUnwrap(),
    udid:         Udid.create('UDID-ANDROID-SCANNER-001')._unsafeUnwrap(),
    platform:     'android',
    model:        'Honeywell CT47',
    osVersion:    '13',
  });

const makeEnrollmentToken = (deviceId?: string) =>
  Token.issue({
    value:      'INVITE-TOKEN-001' as TokenValue,
    purpose:    'enrollment',
    issuedToId: (deviceId ?? newEntityId()) as ReturnType<typeof newEntityId>,
  });

const FAKE_NONCE = 'aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const makeDeviceRepo = (device: ReturnType<typeof makePendingDevice> | null = null) =>
  ({
    findById:           vi.fn().mockResolvedValue(ok(device)),
    findBySerialNumber: vi.fn(),
    findByUdid:         vi.fn(),
    findByGroupId:      vi.fn(),
    save:               vi.fn().mockResolvedValue(ok(undefined)),
    delete:             vi.fn(),
  } satisfies Partial<DeviceRepositoryPort> as unknown as DeviceRepositoryPort);

const makeTokenRepo = (token: Token | null = null) =>
  ({
    findByValue:         vi.fn().mockResolvedValue(ok(token)),
    findByIssuedToId:    vi.fn(),
    findActiveByPurpose: vi.fn(),
    save:                vi.fn().mockResolvedValue(ok(undefined)),
    findById:            vi.fn(),
    delete:              vi.fn(),
  } satisfies Partial<TokenRepositoryPort> as unknown as TokenRepositoryPort);

const makeNonceGen = (nonce: string = FAKE_NONCE) =>
  ({ generate: vi.fn().mockResolvedValue(ok(nonce)) } satisfies NonceGeneratorPort);

// ---------------------------------------------------------------------------
// Тесты
// ---------------------------------------------------------------------------
describe('RequestEnrollmentHandler', () => {

  describe('Сценарий: пользователь ввёл токен и запросил enrollment', () => {
    it('возвращает nonce и expiresAt', async () => {
      const device = makePendingDevice();
      const token  = makeEnrollmentToken(device.id);

      const handler = new RequestEnrollmentHandler(
        makeDeviceRepo(device),
        makeTokenRepo(token),
        makeNonceGen(),
      );

      const result = await handler.execute(
        requestEnrollment(device.id, 'INVITE-TOKEN-001' as TokenValue),
      );

      expect(result.isOk()).toBe(true);
      const { nonce, expiresAt } = result._unsafeUnwrap();
      expect(nonce).toBe(FAKE_NONCE);
      expect(expiresAt).toBeInstanceOf(Date);
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now() + 4 * 60 * 1000);
    });

    it('сохраняет nonce как Token с issuedToId = deviceId', async () => {
      const device    = makePendingDevice();
      const token     = makeEnrollmentToken(device.id);
      const tokenRepo = makeTokenRepo(token);

      await new RequestEnrollmentHandler(
        makeDeviceRepo(device),
        tokenRepo,
        makeNonceGen(),
      ).execute(requestEnrollment(device.id, 'INVITE-TOKEN-001' as TokenValue));

      expect(tokenRepo.save).toHaveBeenCalledOnce();

      const saveMock = tokenRepo.save as ReturnType<typeof vi.fn>;
      const firstCall = saveMock.mock.calls[0];
      // Убеждаемся, что вызов существует (выше уже проверено toHaveBeenCalledOnce)
      expect(firstCall).toBeDefined();
      const savedToken = firstCall![0] as Token;
      expect(savedToken.value).toBe(FAKE_NONCE);
      expect(savedToken.issuedToId).toBe(device.id);
    });
  });

  describe('Ошибки: невалидный токен', () => {
    it('возвращает TOKEN_NOT_FOUND если токен не найден', async () => {
      const device = makePendingDevice();
      const result = await new RequestEnrollmentHandler(
        makeDeviceRepo(device),
        makeTokenRepo(null),
        makeNonceGen(),
      ).execute(requestEnrollment(device.id, 'WRONG-TOKEN' as TokenValue));

      expect(result._unsafeUnwrapErr().code).toBe('TOKEN_NOT_FOUND');
    });

    it('возвращает TOKEN_NOT_ACTIVE если токен уже использован', async () => {
      const device    = makePendingDevice();
      const usedToken = makeEnrollmentToken(device.id);
      usedToken.consume();

      const result = await new RequestEnrollmentHandler(
        makeDeviceRepo(device),
        makeTokenRepo(usedToken),
        makeNonceGen(),
      ).execute(requestEnrollment(device.id, 'INVITE-TOKEN-001' as TokenValue));

      expect(result._unsafeUnwrapErr().code).toBe('TOKEN_NOT_ACTIVE');
    });

    it('возвращает TOKEN_WRONG_PURPOSE если токен не enrollment', async () => {
      const device   = makePendingDevice();
      const apiToken = Token.issue({ value: 'API-KEY-001' as TokenValue, purpose: 'api' });

      const result = await new RequestEnrollmentHandler(
        makeDeviceRepo(device),
        makeTokenRepo(apiToken),
        makeNonceGen(),
      ).execute(requestEnrollment(device.id, 'API-KEY-001' as TokenValue));

      expect(result._unsafeUnwrapErr().code).toBe('TOKEN_WRONG_PURPOSE');
    });
  });

  describe('Ошибки: устройство недоступно или не pending', () => {
    it('возвращает DEVICE_NOT_FOUND', async () => {
      const token  = makeEnrollmentToken();
      const result = await new RequestEnrollmentHandler(
        makeDeviceRepo(null),
        makeTokenRepo(token),
        makeNonceGen(),
      ).execute(requestEnrollment(newEntityId(), 'INVITE-TOKEN-001' as TokenValue));

      expect(result._unsafeUnwrapErr().code).toBe('DEVICE_NOT_FOUND');
    });

    it('возвращает DEVICE_INVALID_STATE если устройство уже enrolled', async () => {
      const device = makePendingDevice();
      device.beginEnrollment();
      device.completeEnrollment();
      const token  = makeEnrollmentToken(device.id);

      const result = await new RequestEnrollmentHandler(
        makeDeviceRepo(device),
        makeTokenRepo(token),
        makeNonceGen(),
      ).execute(requestEnrollment(device.id, 'INVITE-TOKEN-001' as TokenValue));

      expect(result._unsafeUnwrapErr().code).toBe('DEVICE_INVALID_STATE');
    });
  });

  describe('Ошибки: инфраструктура', () => {
    it('пробрасывает ошибку NonceGenerator', async () => {
      const device = makePendingDevice();
      const token  = makeEnrollmentToken(device.id);

      const result = await new RequestEnrollmentHandler(
        makeDeviceRepo(device),
        makeTokenRepo(token),
        { generate: vi.fn().mockResolvedValue(err(domainError('NONCE_GENERATION_FAILED', 'RNG error'))) },
      ).execute(requestEnrollment(device.id, 'INVITE-TOKEN-001' as TokenValue));

      expect(result._unsafeUnwrapErr().code).toBe('NONCE_GENERATION_FAILED');
    });
  });
});
