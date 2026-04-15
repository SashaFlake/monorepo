import { AggregateRoot, newEntityId } from './entity.js';
import type { EntityId } from './entity.js';
import type { Platform } from './value-objects.js';
import type { PolicyRulePayload } from './value-objects.js';
import type { DomainError } from '../error/domain-error.js';
import { domainError } from '../error/domain-error.js';
import { ok, err } from 'neverthrow';
import type { Result } from '../result.js';

// ---------------------------------------------------------------------------
// Policy types
// ---------------------------------------------------------------------------
export const POLICY_TYPES = [
  'passcode',
  'restriction',
  'vpn',
  'wifi',
  'certificate',
  'application',
  'custom',
] as const;
export type PolicyType = (typeof POLICY_TYPES)[number];

export const POLICY_STATUSES = ['draft', 'active', 'archived'] as const;
export type PolicyStatus = (typeof POLICY_STATUSES)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface PolicyProps {
  readonly id: EntityId;
  name: string;
  description: string;
  type: PolicyType;
  platforms: Platform[];
  rules: PolicyRulePayload;
  status: PolicyStatus;
  version: number;
  readonly createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Aggregate
// ---------------------------------------------------------------------------
export class Policy extends AggregateRoot<PolicyProps> {
  private constructor(props: PolicyProps) { super(props); }

  static create(params: {
    name: string;
    description?: string;
    type: PolicyType;
    platforms: Platform[];
    rules: PolicyRulePayload;
  }): Result<Policy, DomainError> {
    const name = params.name.trim();
    if (name.length < 2 || name.length > 128)
      return err(domainError('INVALID_POLICY_NAME', 'Policy name must be 2–128 characters', { name }));
    if (params.platforms.length === 0)
      return err(domainError('POLICY_REQUIRES_PLATFORM', 'At least one platform must be specified'));
    const now = new Date();
    return ok(new Policy({
      id: newEntityId(),
      name,
      description: params.description?.trim() ?? '',
      type: params.type,
      platforms: [...params.platforms],
      rules: params.rules,
      status: 'draft',
      version: 1,
      createdAt: now,
      updatedAt: now,
    }));
  }

  static reconstitute(props: PolicyProps): Policy {
    return new Policy(props);
  }

  // --- Getters ---
  get name(): string              { return this.props.name; }
  get description(): string       { return this.props.description; }
  get type(): PolicyType          { return this.props.type; }
  get platforms(): Platform[]     { return [...this.props.platforms]; }
  get rules(): PolicyRulePayload  { return this.props.rules; }
  get status(): PolicyStatus      { return this.props.status; }
  get version(): number           { return this.props.version; }
  get createdAt(): Date           { return this.props.createdAt; }
  get updatedAt(): Date           { return this.props.updatedAt; }

  // --- Behaviour ---
  activate(): Result<void, DomainError> {
    if (this.props.status !== 'draft')
      return err(domainError('POLICY_NOT_DRAFT', 'Only draft policies can be activated', { status: this.props.status }));
    this.props.status    = 'active';
    this.props.updatedAt = new Date();
    return ok(undefined);
  }

  archive(): Result<void, DomainError> {
    if (this.props.status === 'archived')
      return err(domainError('POLICY_ALREADY_ARCHIVED', 'Policy is already archived'));
    this.props.status    = 'archived';
    this.props.updatedAt = new Date();
    return ok(undefined);
  }

  updateRules(rules: PolicyRulePayload): Result<void, DomainError> {
    if (this.props.status === 'archived')
      return err(domainError('POLICY_ARCHIVED', 'Cannot update rules of an archived policy'));
    this.props.rules    = rules;
    this.props.version += 1;
    this.props.updatedAt = new Date();
    return ok(undefined);
  }
}
