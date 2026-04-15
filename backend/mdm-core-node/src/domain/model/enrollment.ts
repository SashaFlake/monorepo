import { AggregateRoot, newEntityId } from './entity.js';
import type { EntityId } from './entity.js';
import type { Platform } from './value-objects.js';
import type { DomainError } from '../error/domain-error.js';
import { domainError } from '../error/domain-error.js';
import { ok, err } from 'neverthrow';
import type { Result } from '../result.js';
import { EnrollmentCompletedEvent, EnrollmentRevokedEvent } from '../event/enrollment-events.js';

// ---------------------------------------------------------------------------
// Enrollment statuses
// ---------------------------------------------------------------------------
export const ENROLLMENT_STATUSES = [
  'initiated',   // token issued, waiting for device
  'completed',   // device successfully enrolled
  'failed',      // enrollment process failed
  'revoked',     // admin-revoked
  'expired',     // token TTL exceeded
] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface EnrollmentProps {
  readonly id: EntityId;
  deviceId: EntityId | null;     // null until device is created during enrollment
  tokenId: EntityId;             // references the one-time Token used
  platform: Platform;
  status: EnrollmentStatus;
  failureReason: string | null;
  readonly initiatedAt: Date;
  completedAt: Date | null;
  expiresAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Aggregate
// ---------------------------------------------------------------------------
export class Enrollment extends AggregateRoot<EnrollmentProps> {
  private constructor(props: EnrollmentProps) { super(props); }

  static initiate(params: {
    tokenId: EntityId;
    platform: Platform;
    ttlSeconds?: number;
  }): Enrollment {
    const now = new Date();
    const ttl = params.ttlSeconds ?? 3600;
    return new Enrollment({
      id: newEntityId(),
      deviceId: null,
      tokenId: params.tokenId,
      platform: params.platform,
      status: 'initiated',
      failureReason: null,
      initiatedAt: now,
      completedAt: null,
      expiresAt: new Date(now.getTime() + ttl * 1000),
      updatedAt: now,
    });
  }

  static reconstitute(props: EnrollmentProps): Enrollment {
    return new Enrollment(props);
  }

  // --- Getters ---
  get deviceId(): EntityId | null       { return this.props.deviceId; }
  get tokenId(): EntityId               { return this.props.tokenId; }
  get platform(): Platform              { return this.props.platform; }
  get status(): EnrollmentStatus        { return this.props.status; }
  get failureReason(): string | null    { return this.props.failureReason; }
  get initiatedAt(): Date               { return this.props.initiatedAt; }
  get completedAt(): Date | null        { return this.props.completedAt; }
  get expiresAt(): Date                 { return this.props.expiresAt; }
  get updatedAt(): Date                 { return this.props.updatedAt; }

  // --- Behaviour ---
  complete(deviceId: EntityId): Result<void, DomainError> {
    if (this.props.status !== 'initiated')
      return err(domainError('ENROLLMENT_NOT_INITIATED', 'Enrollment is not in initiated state', { status: this.props.status }));
    if (new Date() > this.props.expiresAt)
      return err(domainError('ENROLLMENT_TOKEN_EXPIRED', 'Enrollment token has expired'));
    const now = new Date();
    this.props.deviceId    = deviceId;
    (this.props as { status: EnrollmentStatus }).status = 'completed';
    this.props.completedAt = now;
    this.props.updatedAt   = now;
    this.addEvent(new EnrollmentCompletedEvent(this.id, deviceId, now));
    return ok(undefined);
  }

  fail(reason: string): Result<void, DomainError> {
    if (!['initiated'].includes(this.props.status))
      return err(domainError('ENROLLMENT_CANNOT_FAIL', 'Enrollment is not in a failable state', { status: this.props.status }));
    (this.props as { status: EnrollmentStatus }).status = 'failed';
    this.props.failureReason = reason;
    this.props.updatedAt     = new Date();
    return ok(undefined);
  }

  revoke(): Result<void, DomainError> {
    if (['revoked', 'completed'].includes(this.props.status))
      return err(domainError('ENROLLMENT_CANNOT_REVOKE', 'Enrollment cannot be revoked in current state', { status: this.props.status }));
    (this.props as { status: EnrollmentStatus }).status = 'revoked';
    this.props.updatedAt = new Date();
    this.addEvent(new EnrollmentRevokedEvent(this.id, new Date()));
    return ok(undefined);
  }

  isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }
}
