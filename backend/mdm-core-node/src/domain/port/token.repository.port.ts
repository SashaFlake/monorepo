import type { Repository } from './repository.js';
import type { Token } from '../model/token.js';
import type { TokenPurpose } from '../model/token.js';
import type { TokenValue } from '../model/value-objects.js';
import type { EntityId } from '../model/entity.js';
import type { DomainError } from '../error/domain-error.js';
import type { Result } from '../result.js';

export interface TokenRepositoryPort extends Repository<Token> {
  findByValue(value: TokenValue): Promise<Result<Token | null, DomainError>>;
  findByIssuedToId(issuedToId: EntityId): Promise<Result<Token[], DomainError>>;
  findActiveByPurpose(purpose: TokenPurpose): Promise<Result<Token[], DomainError>>;
}

export const TOKEN_REPOSITORY = Symbol('TokenRepositoryPort');
