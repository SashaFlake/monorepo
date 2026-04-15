import type { EntityId } from '../model/entity.js';
import { DomainEvent } from './domain-event.js';

export class DeviceEnrolledEvent extends DomainEvent {
  readonly eventType = 'device.enrolled' as const;
  constructor(aggregateId: EntityId, readonly occurredAt: Date) {
    super(aggregateId);
  }
}

export class DeviceEnrollmentStartedEvent extends DomainEvent {
  readonly eventType = 'device.enrollment_started' as const;
  constructor(aggregateId: EntityId, readonly occurredAt: Date) {
    super(aggregateId);
  }
}

export class DeviceUnenrolledEvent extends DomainEvent {
  readonly eventType = 'device.unenrolled' as const;
  constructor(aggregateId: EntityId, readonly occurredAt: Date) {
    super(aggregateId);
  }
}

export class DeviceGroupAssignedEvent extends DomainEvent {
  readonly eventType = 'device.group_assigned' as const;
  constructor(
    aggregateId: EntityId,
    readonly groupId: EntityId,
    readonly occurredAt: Date,
  ) {
    super(aggregateId);
  }
}
