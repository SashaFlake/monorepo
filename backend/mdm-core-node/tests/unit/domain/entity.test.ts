import { describe, it, expect } from 'vitest';
import { entityId, newEntityId, Entity } from '@domain/model/index.js';
import type { EntityId } from '@domain/model/index.js';

interface TestProps { id: EntityId; name: string; }
class TestEntity extends Entity<TestProps> {
  static create(name: string): TestEntity {
    return new TestEntity({ id: newEntityId(), name });
  }
  get name(): string { return this.props.name; }
}

describe('Entity', () => {
  it('should have a stable id', () => {
    const entity = TestEntity.create('foo');
    expect(entity.id).toBeTruthy();
  });

  it('equals() returns true for same id', () => {
    const id = entityId('same-id');
    const a = new (class extends Entity<TestProps> {})(({ id, name: 'a' }));
    const b = new (class extends Entity<TestProps> {})(({ id, name: 'b' }));
    expect(a.equals(b)).toBe(true);
  });
});
