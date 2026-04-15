import type { Repository } from './repository.js';
import type { Certificate } from '../model/certificate.js';
import type { CertificateFingerprint } from '../model/value-objects.js';
import type { EntityId } from '../model/entity.js';
import type { DomainError } from '../error/domain-error.js';
import type { Result } from '../result.js';

export interface CertificateRepositoryPort extends Repository<Certificate> {
  findByFingerprint(fingerprint: CertificateFingerprint): Promise<Result<Certificate | null, DomainError>>;
  findByDeviceId(deviceId: EntityId): Promise<Result<Certificate[], DomainError>>;
  findExpiredBefore(date: Date): Promise<Result<Certificate[], DomainError>>;
}

export const CERTIFICATE_REPOSITORY = Symbol('CertificateRepositoryPort');
