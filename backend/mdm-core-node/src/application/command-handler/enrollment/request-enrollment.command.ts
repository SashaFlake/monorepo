import type { Command } from '@domain/command/index.js';
import type { EntityId } from '@domain/model/entity.js';
import type { TokenValue } from '@domain/model/value-objects.js';

/**
 * Пользователь ввёл токен enrollment и инициирует запрос на enrollment.
 *
 * Система:
 * 1. Проверяет токен enrollment.
 * 2. Находит устройство (serialNumber или deviceId).
 * 3. Генерирует nonce и сохраняет его как Token(purpose=certificate_challenge).
 * 4. Возвращает nonce устройству.
 */
export interface RequestEnrollmentCommand extends Command {
  readonly _type: 'enrollment.request';
  /** ID устройства, которое запрашивает enrollment. */
  readonly deviceId: EntityId;
  /** Токен приглашения, выданный отделом закупок. */
  readonly enrollmentToken: TokenValue;
}

export const REQUEST_ENROLLMENT = 'enrollment.request' as const;

export const requestEnrollment = (
  deviceId: EntityId,
  enrollmentToken: TokenValue,
): RequestEnrollmentCommand => ({ _type: REQUEST_ENROLLMENT, deviceId, enrollmentToken });
