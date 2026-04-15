import { BaseDomainEvent } from './domain-event.js';
import type { EntityId } from '../model/entity.js';

export class EnrollmentCompletedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    readonly deviceId: EntityId,
    occurredAt?: Date,
  ) {
    super('enrollment.completed', aggregateId, occurredAt);
  }
}

export class EnrollmentRevokedEvent extends BaseDomainEvent {
  constructor(aggregateId: EntityId, occurredAt?: Date) {
    super('enrollment.revoked', aggregateId, occurredAt);
  }
}
