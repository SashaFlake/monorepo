import { randomUUID } from 'node:crypto';
import type { EntityId } from '../model/entity.js';

export interface DomainEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly occurredAt: Date;
  readonly aggregateId: EntityId;
}

export abstract class BaseDomainEvent implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  constructor(
    readonly eventType: string,
    readonly aggregateId: EntityId,
    occurredAt?: Date,
  ) {
    this.eventId    = randomUUID();
    this.occurredAt = occurredAt ?? new Date();
  }
}
