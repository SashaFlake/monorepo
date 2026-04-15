import type { DomainError } from '../error/domain-error.js';
import type { Result } from '../result.js';

/**
 * Генерирует криптографически стойкий nonce для challenge-response валидации
 * сертификата устройства.
 * Реализация: инфраструктурный слой (напр. node:crypto randomBytes).
 */
export interface NonceGeneratorPort {
  /** Генерирует nonce длиной `byteLength` байт. Возвращает hex-строку. */
  generate(byteLength: number): Promise<Result<string, DomainError>>;
}

export const NONCE_GENERATOR = Symbol('NonceGeneratorPort');
