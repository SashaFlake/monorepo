import { AggregateRoot, newEntityId } from './entity.js';
import type { EntityId } from './entity.js';
import type { TokenValue } from './value-objects.js';
import type { DomainError } from '../error/domain-error.js';
import { domainError } from '../error/domain-error.js';
import { ok, err } from 'neverthrow';
import type { Result } from '../result.js';

// ---------------------------------------------------------------------------
// Token purposes
// ---------------------------------------------------------------------------
export const TOKEN_PURPOSES = [
  'enrollment',   // one-time enrollment invite
  'push',         // APNs / FCM push auth
  'api',          // long-lived API key
  'reset',        // password / PIN reset
] as const;
export type TokenPurpose = (typeof TOKEN_PURPOSES)[number];

export const TOKEN_STATUSES = ['active', 'used', 'revoked', 'expired'] as const;
export type TokenStatus = (typeof TOKEN_STATUSES)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface TokenProps {
  readonly id: EntityId;
  value: TokenValue;               // hashed before persistence
  purpose: TokenPurpose;
  status: TokenStatus;
  issuedToId: EntityId | null;     // user or device it was issued to
  usedAt: Date | null;
  revokedAt: Date | null;
  readonly issuedAt: Date;
  expiresAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Aggregate
// ---------------------------------------------------------------------------
export class Token extends AggregateRoot<TokenProps> {
  private constructor(props: TokenProps) { super(props); }

  static issue(params: {
    value: TokenValue;
    purpose: TokenPurpose;
    issuedToId?: EntityId;
    ttlSeconds?: number;
  }): Token {
    const now = new Date();
    const ttl = params.ttlSeconds ?? (params.purpose === 'api' ? 365 * 24 * 3600 : 3600);
    return new Token({
      id: newEntityId(),
      value: params.value,
      purpose: params.purpose,
      status: 'active',
      issuedToId: params.issuedToId ?? null,
      usedAt: null,
      revokedAt: null,
      issuedAt: now,
      expiresAt: new Date(now.getTime() + ttl * 1000),
      updatedAt: now,
    });
  }

  static reconstitute(props: TokenProps): Token {
    return new Token(props);
  }

  // --- Getters ---
  get value(): TokenValue            { return this.props.value; }
  get purpose(): TokenPurpose        { return this.props.purpose; }
  get status(): TokenStatus          { return this.props.status; }
  get issuedToId(): EntityId | null  { return this.props.issuedToId; }
  get usedAt(): Date | null          { return this.props.usedAt; }
  get revokedAt(): Date | null       { return this.props.revokedAt; }
  get issuedAt(): Date               { return this.props.issuedAt; }
  get expiresAt(): Date              { return this.props.expiresAt; }
  get updatedAt(): Date              { return this.props.updatedAt; }

  // --- Behaviour ---

  /** Consume a one-time token (enrollment, reset). */
  consume(): Result<void, DomainError> {
    if (this.props.status !== 'active')
      return err(domainError('TOKEN_NOT_ACTIVE', 'Token is not active', { status: this.props.status }));
    if (this.isExpired())
      return err(domainError('TOKEN_EXPIRED', 'Token has expired'));
    if (this.props.purpose === 'api')
      return err(domainError('TOKEN_NOT_CONSUMABLE', 'API tokens cannot be consumed'));
    const now = new Date();
    (this.props as { status: TokenStatus }).status = 'used';
    this.props.usedAt    = now;
    this.props.updatedAt = now;
    return ok(undefined);
  }

  revoke(): Result<void, DomainError> {
    if (['revoked', 'used'].includes(this.props.status))
      return err(domainError('TOKEN_CANNOT_REVOKE', 'Token cannot be revoked in current state', { status: this.props.status }));
    const now = new Date();
    (this.props as { status: TokenStatus }).status = 'revoked';
    this.props.revokedAt = now;
    this.props.updatedAt = now;
    return ok(undefined);
  }

  isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  isValid(): boolean {
    return this.props.status === 'active' && !this.isExpired();
  }
}
