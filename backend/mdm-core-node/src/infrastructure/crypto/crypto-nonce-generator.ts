import 'reflect-metadata';
import { injectable } from 'tsyringe';
import { randomBytes } from 'node:crypto';
import { ok, err } from 'neverthrow';
import { domainError } from '@domain/error/domain-error.js';
import type { NonceGeneratorPort } from '@domain/port/nonce.generator.port.js';
import type { Result } from '@domain/result.js';
import type { DomainError } from '@domain/error/domain-error.js';

/**
 * Реализация NonceGeneratorPort через node:crypto.
 * randomBytes() использует CSPRNG ОС — криптографически стойкий.
 */
@injectable()
export class CryptoNonceGenerator implements NonceGeneratorPort {
  async generate(byteLength: number): Promise<Result<string, DomainError>> {
    try {
      const buf = randomBytes(byteLength);
      return ok(buf.toString('hex'));
    } catch (cause) {
      return err(domainError(
        'NONCE_GENERATION_FAILED',
        'Failed to generate nonce via node:crypto',
        { cause: cause instanceof Error ? cause.message : String(cause) },
      ));
    }
  }
}
