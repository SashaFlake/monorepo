import type { EntityId } from '../model/entity.js';
import type { Result } from '../result.js';
import type { DomainError } from '../error/domain-error.js';
import {Device} from "@domain/model/index.js";

export interface Repository<T> {
  findById(id: EntityId): Promise<Result<T | null, DomainError>>;
  save(entity: T): Promise<Result<T, DomainError>>;
  delete(id: EntityId): Promise<Result<void, DomainError>>;
}
