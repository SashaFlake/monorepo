import type { EntityId } from '../model/entity.js';
import { BaseDomainEvent } from './domain-event.js';

export class DeviceEnrolledEvent extends BaseDomainEvent {
  constructor(aggregateId: EntityId, occurredAt: Date) {
    super('device.enrolled', aggregateId, occurredAt);
  }
}

export class DeviceEnrollmentStartedEvent extends BaseDomainEvent {
  constructor(aggregateId: EntityId, occurredAt: Date) {
    super('device.enrollment_started', aggregateId, occurredAt);
  }
}

export class DeviceUnenrolledEvent extends BaseDomainEvent {
  constructor(aggregateId: EntityId, occurredAt: Date) {
    super('device.unenrolled', aggregateId, occurredAt);
  }
}

export class DeviceGroupAssignedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    readonly groupId: EntityId,
    occurredAt: Date,
  ) {
    super('device.group_assigned', aggregateId, occurredAt);
  }
}
