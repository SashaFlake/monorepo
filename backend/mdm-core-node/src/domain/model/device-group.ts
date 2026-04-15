import { AggregateRoot, newEntityId, entityId } from './entity.js';
import type { EntityId } from './entity.js';
import type { DomainError } from '../error/domain-error.js';
import { domainError } from '../error/domain-error.js';
import { ok, err } from 'neverthrow';
import type { Result } from '../result.js';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface DeviceGroupProps {
  readonly id: EntityId;
  name: string;
  description: string;
  policyIds: EntityId[];
  readonly createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Aggregate
// ---------------------------------------------------------------------------
export class DeviceGroup extends AggregateRoot<DeviceGroupProps> {
  private constructor(props: DeviceGroupProps) { super(props); }

  static create(params: { name: string; description?: string }): Result<DeviceGroup, DomainError> {
    const name = params.name.trim();
    if (name.length < 2 || name.length > 128)
      return err(domainError('INVALID_GROUP_NAME', 'Group name must be 2–128 characters', { name }));
    const now = new Date();
    return ok(new DeviceGroup({
      id: newEntityId(),
      name,
      description: params.description?.trim() ?? '',
      policyIds: [],
      createdAt: now,
      updatedAt: now,
    }));
  }

  static reconstitute(props: DeviceGroupProps): DeviceGroup {
    return new DeviceGroup(props);
  }

  // --- Getters ---
  get name(): string              { return this.props.name; }
  get description(): string       { return this.props.description; }
  get policyIds(): EntityId[]     { return [...this.props.policyIds]; }
  get createdAt(): Date           { return this.props.createdAt; }
  get updatedAt(): Date           { return this.props.updatedAt; }

  // --- Behaviour ---
  rename(name: string): Result<void, DomainError> {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 128)
      return err(domainError('INVALID_GROUP_NAME', 'Group name must be 2–128 characters', { name }));
    this.props.name      = trimmed;
    this.props.updatedAt = new Date();
    return ok(undefined);
  }

  attachPolicy(policyId: EntityId): Result<void, DomainError> {
    if (this.props.policyIds.includes(policyId))
      return err(domainError('POLICY_ALREADY_ATTACHED', 'Policy is already attached to this group', { policyId }));
    this.props.policyIds.push(policyId);
    this.props.updatedAt = new Date();
    return ok(undefined);
  }

  detachPolicy(policyId: EntityId): Result<void, DomainError> {
    const idx = this.props.policyIds.indexOf(policyId);
    if (idx === -1)
      return err(domainError('POLICY_NOT_ATTACHED', 'Policy is not attached to this group', { policyId }));
    this.props.policyIds.splice(idx, 1);
    this.props.updatedAt = new Date();
    return ok(undefined);
  }
}
