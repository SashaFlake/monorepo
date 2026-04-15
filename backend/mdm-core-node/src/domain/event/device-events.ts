import { BaseDomainEvent } from './domain-event.js';
import type { EntityId } from '../model/entity.js';

export class DeviceEnrolledEvent extends BaseDomainEvent {
  constructor(aggregateId: EntityId, occurredAt?: Date) {
    super('device.enrolled', aggregateId, occurredAt);
  }
}

export class DeviceUnenrolledEvent extends BaseDomainEvent {
  constructor(aggregateId: EntityId, occurredAt?: Date) {
    super('device.unenrolled', aggregateId, occurredAt);
  }
}

export class DeviceGroupAssignedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    readonly groupId: EntityId,
    occurredAt?: Date,
  ) {
    super('device.group_assigned', aggregateId, occurredAt);
  }
}
