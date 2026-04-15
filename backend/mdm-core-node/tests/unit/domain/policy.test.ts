import { describe, it, expect } from 'vitest';
import { Policy } from '../../../src/domain/model/policy.js';

const makePolicy = () =>
  Policy.create({
    name: 'iOS Passcode Policy',
    type: 'passcode',
    platforms: ['ios'],
    rules: { minLength: 6, requireAlphanumeric: true },
  });

describe('Policy', () => {
  it('creates in draft status, version 1', () => {
    const result = makePolicy();
    expect(result.isOk()).toBe(true);
    const policy = result._unsafeUnwrap();
    expect(policy.status).toBe('draft');
    expect(policy.version).toBe(1);
  });

  it('activates a draft policy', () => {
    const policy = makePolicy()._unsafeUnwrap();
    const result = policy.activate();
    expect(result.isOk()).toBe(true);
    expect(policy.status).toBe('active');
  });

  it('cannot activate an already-active policy', () => {
    const policy = makePolicy()._unsafeUnwrap();
    policy.activate();
    const result = policy.activate();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('POLICY_NOT_DRAFT');
  });

  it('bumps version on rules update', () => {
    const policy = makePolicy()._unsafeUnwrap();
    policy.updateRules({ minLength: 8 });
    expect(policy.version).toBe(2);
  });

  it('cannot update rules of archived policy', () => {
    const policy = makePolicy()._unsafeUnwrap();
    policy.activate();
    policy.archive();
    const result = policy.updateRules({ minLength: 4 });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('POLICY_ARCHIVED');
  });

  it('fails with empty platforms', () => {
    const result = Policy.create({ name: 'bad', type: 'custom', platforms: [], rules: {} });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('POLICY_REQUIRES_PLATFORM');
  });
});
