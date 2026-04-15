import type { EntityId } from '../model/index.js';
import type { Result } from '../result.js';
import type { DomainError } from '../error/index.js';

/**
 * Generic repository port — implemented in infrastructure layer.
 */
export interface Repository<T> {
  findById(id: EntityId): Promise<Result<T | null, DomainError>>;
  save(entity: T): Promise<Result<void, DomainError>>;
  delete(id: EntityId): Promise<Result<void, DomainError>>;
}
