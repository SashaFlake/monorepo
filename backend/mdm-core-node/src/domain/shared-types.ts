/**
 * Shared primitive types used by both entity.ts and domain-event.ts.
 * Kept in a separate file to break the circular dependency:
 *   entity.ts → domain-event.ts → entity.ts
 */
import { randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// Branded EntityId
// ---------------------------------------------------------------------------
export type EntityId = string & { readonly _brand: 'EntityId' };
export const newEntityId = (): EntityId => randomUUID() as EntityId;
export const entityId   = (value: string): EntityId => value as EntityId;

// ---------------------------------------------------------------------------
// DomainEvent interface (no imports from model/ or event/)
// ---------------------------------------------------------------------------
export interface DomainEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly occurredAt: Date;
  readonly aggregateId: EntityId;
}
