import { AggregateRoot, newEntityId } from './entity.js';
import type { EntityId } from './entity.js';
import type { CertificateFingerprint } from './value-objects.js';
import type { DomainError } from '../error/domain-error.js';
import { domainError } from '../error/domain-error.js';
import { ok, err } from 'neverthrow';
import type { Result } from '../result.js';

// ---------------------------------------------------------------------------
// Certificate types & statuses
// ---------------------------------------------------------------------------
export const CERTIFICATE_TYPES = ['device', 'user', 'ca', 'scep', 'push'] as const;
export type CertificateType = (typeof CERTIFICATE_TYPES)[number];

export const CERTIFICATE_STATUSES = ['active', 'revoked', 'expired'] as const;
export type CertificateStatus = (typeof CERTIFICATE_STATUSES)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface CertificateProps {
  readonly id: EntityId;
  deviceId: EntityId | null;         // null for CA/push certs
  type: CertificateType;
  subject: string;                   // DN, e.g. "CN=device-001,O=Acme"
  issuer: string;
  fingerprint: CertificateFingerprint;
  serialNumber: string;              // certificate serial (hex)
  pemEncoded: string;                // PEM (public cert only, no private key)
  status: CertificateStatus;
  readonly issuedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Aggregate
// ---------------------------------------------------------------------------
export class Certificate extends AggregateRoot<CertificateProps> {
  private constructor(props: CertificateProps) { super(props); }

  static issue(params: Omit<CertificateProps, 'id' | 'status' | 'revokedAt' | 'updatedAt'>): Certificate {
    const now = new Date();
    return new Certificate({
      ...params,
      id: newEntityId(),
      status: 'active',
      revokedAt: null,
      updatedAt: now,
    });
  }

  static reconstitute(props: CertificateProps): Certificate {
    return new Certificate(props);
  }

  // --- Getters ---
  get deviceId(): EntityId | null               { return this.props.deviceId; }
  get type(): CertificateType                   { return this.props.type; }
  get subject(): string                         { return this.props.subject; }
  get issuer(): string                          { return this.props.issuer; }
  get fingerprint(): CertificateFingerprint     { return this.props.fingerprint; }
  get serialNumber(): string                    { return this.props.serialNumber; }
  get pemEncoded(): string                      { return this.props.pemEncoded; }
  get status(): CertificateStatus               { return this.props.status; }
  get issuedAt(): Date                          { return this.props.issuedAt; }
  get expiresAt(): Date                         { return this.props.expiresAt; }
  get revokedAt(): Date | null                  { return this.props.revokedAt; }
  get updatedAt(): Date                         { return this.props.updatedAt; }

  // --- Behaviour ---
  revoke(): Result<void, DomainError> {
    if (this.props.status === 'revoked')
      return err(domainError('CERTIFICATE_ALREADY_REVOKED', 'Certificate is already revoked'));
    const now = new Date();
    (this.props as { status: CertificateStatus }).status = 'revoked';
    this.props.revokedAt = now;
    this.props.updatedAt = now;
    return ok(undefined);
  }

  expire(): Result<void, DomainError> {
    if (this.props.status !== 'active')
      return err(domainError('CERTIFICATE_NOT_ACTIVE', 'Only active certificates can be marked as expired'));
    (this.props as { status: CertificateStatus }).status = 'expired';
    this.props.updatedAt = new Date();
    return ok(undefined);
  }

  isExpired(): boolean {
    return new Date() > this.props.expiresAt || this.props.status === 'expired';
  }

  isValid(): boolean {
    return this.props.status === 'active' && !this.isExpired();
  }
}
