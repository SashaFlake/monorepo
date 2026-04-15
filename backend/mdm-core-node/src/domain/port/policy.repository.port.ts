import type { Repository } from './repository.js';
import type { Policy } from '../model/policy.js';
import type { PolicyStatus, PolicyType } from '../model/policy.js';
import type { Platform } from '../model/value-objects.js';
import type { DomainError } from '../error/domain-error.js';
import type { Result } from '../result.js';

export interface PolicyRepositoryPort extends Repository<Policy> {
  findByStatus(status: PolicyStatus): Promise<Result<Policy[], DomainError>>;
  findByTypeAndPlatform(type: PolicyType, platform: Platform): Promise<Result<Policy[], DomainError>>;
}

export const POLICY_REPOSITORY = Symbol('PolicyRepositoryPort');
