import { AggregateRoot, newEntityId, entityId } from './entity.js';
import type { EntityId } from './entity.js';
import type { DeviceSerialNumber, Platform, Udid } from './value-objects.js';
import type { DomainError } from '../error/domain-error.js';
import { domainError } from '../error/domain-error.js';
import { ok, err } from 'neverthrow';
import type { Result } from '../result.js';
import {
  DeviceEnrolledEvent,
  DeviceUnenrolledEvent,
  DeviceGroupAssignedEvent,
} from '../event/device-events.js';

// ---------------------------------------------------------------------------
// Device status
// ---------------------------------------------------------------------------
export const DEVICE_STATUSES = [
  'pending',      // registered, awaiting enrollment
  'enrolled',     // enrolled and active
  'unenrolled',   // gracefully unenrolled
  'quarantined',  // policy violation
  'wiped',        // factory-reset triggered
  'retired',      // permanently decommissioned
] as const;
export type DeviceStatus = (typeof DEVICE_STATUSES)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface DeviceProps {
  readonly id: EntityId;
  serialNumber: DeviceSerialNumber;
  udid: Udid;
  platform: Platform;
  model: string;
  osVersion: string;
  status: DeviceStatus;
  groupId: EntityId | null;
  lastSeenAt: Date | null;
  readonly enrolledAt: Date | null;
  readonly createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Aggregate
// ---------------------------------------------------------------------------
export class Device extends AggregateRoot<DeviceProps> {
  private constructor(props: DeviceProps) { super(props); }

  // --- Factory ---
  static create(
    params: Omit<DeviceProps, 'id' | 'status' | 'groupId' | 'lastSeenAt' | 'enrolledAt' | 'createdAt' | 'updatedAt'>,
  ): Device {
    const now = new Date();
    return new Device({
      ...params,
      id: newEntityId(),
      status: 'pending',
      groupId: null,
      lastSeenAt: null,
      enrolledAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: DeviceProps): Device {
    return new Device(props);
  }

  // --- Getters ---
  get serialNumber(): DeviceSerialNumber { return this.props.serialNumber; }
  get udid(): Udid                       { return this.props.udid; }
  get platform(): Platform               { return this.props.platform; }
  get model(): string                    { return this.props.model; }
  get osVersion(): string                { return this.props.osVersion; }
  get status(): DeviceStatus             { return this.props.status; }
  get groupId(): EntityId | null         { return this.props.groupId; }
  get lastSeenAt(): Date | null          { return this.props.lastSeenAt; }
  get enrolledAt(): Date | null          { return this.props.enrolledAt; }
  get createdAt(): Date                  { return this.props.createdAt; }
  get updatedAt(): Date                  { return this.props.updatedAt; }

  // --- Behaviour ---
  enroll(): Result<void, DomainError> {
    if (this.props.status !== 'pending')
      return err(domainError('DEVICE_ALREADY_ENROLLED', 'Device is not in pending state', { status: this.props.status }));
    const now = new Date();
    (this.props as { status: DeviceStatus }).status = 'enrolled';
    (this.props as { enrolledAt: Date | null }).enrolledAt = now;
    this.props.updatedAt = now;
    this.addEvent(new DeviceEnrolledEvent(this.id, now));
    return ok(undefined);
  }

  unenroll(): Result<void, DomainError> {
    if (this.props.status !== 'enrolled')
      return err(domainError('DEVICE_NOT_ENROLLED', 'Cannot unenroll a device that is not enrolled', { status: this.props.status }));
    const now = new Date();
    (this.props as { status: DeviceStatus }).status = 'unenrolled';
    this.props.updatedAt = now;
    this.addEvent(new DeviceUnenrolledEvent(this.id, now));
    return ok(undefined);
  }

  assignGroup(groupId: EntityId): Result<void, DomainError> {
    if (this.props.status === 'retired' || this.props.status === 'wiped')
      return err(domainError('DEVICE_INACTIVE', 'Cannot assign group to inactive device', { status: this.props.status }));
    this.props.groupId  = groupId;
    this.props.updatedAt = new Date();
    this.addEvent(new DeviceGroupAssignedEvent(this.id, groupId, new Date()));
    return ok(undefined);
  }

  recordSeen(): void {
    this.props.lastSeenAt = new Date();
    this.props.updatedAt  = new Date();
  }

  updateOs(osVersion: string): void {
    this.props.osVersion  = osVersion;
    this.props.updatedAt  = new Date();
  }
}
