import { randomUUID } from 'node:crypto';
import type { EntityId } from '../shared-types.js';

// Re-export so existing imports from this file keep working
export type { DomainEvent } from '../shared-types.js';

export abstract class BaseDomainEvent {
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
