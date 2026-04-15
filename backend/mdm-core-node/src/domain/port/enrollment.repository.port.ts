import type { Repository } from './repository.js';
import type { Enrollment } from '../model/enrollment.js';
import type { EnrollmentStatus } from '../model/enrollment.js';
import type { EntityId } from '../model/entity.js';
import type { DomainError } from '../error/domain-error.js';
import type { Result } from '../result.js';

export interface EnrollmentRepositoryPort extends Repository<Enrollment> {
  findByTokenId(tokenId: EntityId): Promise<Result<Enrollment | null, DomainError>>;
  findByDeviceId(deviceId: EntityId): Promise<Result<Enrollment[], DomainError>>;
  findByStatus(status: EnrollmentStatus): Promise<Result<Enrollment[], DomainError>>;
}

export const ENROLLMENT_REPOSITORY = Symbol('EnrollmentRepositoryPort');
