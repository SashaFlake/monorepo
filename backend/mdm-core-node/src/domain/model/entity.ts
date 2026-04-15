import { randomUUID } from 'node:crypto';

export type EntityId = string & { readonly _brand: 'EntityId' };

export const newEntityId = (): EntityId => randomUUID() as EntityId;
export const entityId = (value: string): EntityId => value as EntityId;

export abstract class Entity<T extends { id: EntityId }> {
  protected readonly props: T;

  protected constructor(props: T) {
    this.props = props;
  }

  get id(): EntityId {
    return this.props.id;
  }

  equals(other: Entity<T>): boolean {
    return this.id === other.id;
  }
}
