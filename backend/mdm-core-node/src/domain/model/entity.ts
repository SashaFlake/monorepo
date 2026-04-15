import { randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// Branded EntityId
// ---------------------------------------------------------------------------
export type EntityId = string & { readonly _brand: 'EntityId' };
export const newEntityId = (): EntityId => randomUUID() as EntityId;
export const entityId   = (value: string): EntityId => value as EntityId;

// ---------------------------------------------------------------------------
// Domain event collector (Aggregate root)
// ---------------------------------------------------------------------------
import type { DomainEvent } from '../event/domain-event.js';

export abstract class AggregateRoot<TProps extends { id: EntityId }> {
  protected readonly props: TProps;
  private readonly _events: DomainEvent[] = [];

  protected constructor(props: TProps) {
    this.props = props;
  }

  get id(): EntityId { return this.props.id; }

  protected addEvent(event: DomainEvent): void {
    this._events.push(event);
  }

  pullEvents(): DomainEvent[] {
    return this._events.splice(0);
  }

  equals(other: AggregateRoot<TProps>): boolean {
    return this.id === other.id;
  }
}
