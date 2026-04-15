import type { DomainEvent } from '../shared-types.js';
export type { EntityId } from '../shared-types.js';
export { newEntityId, entityId } from '../shared-types.js';
import type { EntityId } from '../shared-types.js';

// ---------------------------------------------------------------------------
// AggregateRoot — domain event collector
// ---------------------------------------------------------------------------
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
