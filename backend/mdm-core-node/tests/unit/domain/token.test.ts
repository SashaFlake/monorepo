import { describe, it, expect } from 'vitest';
import { Token } from '../../../src/domain/model/token.js';
import { TokenValue } from '../../../src/domain/model/value-objects.js';

const makeToken = (purpose: 'enrollment' | 'api' = 'enrollment') => {
  const val = TokenValue.create('a'.repeat(48));
  if (val.isErr()) throw new Error('VO creation failed');
  return Token.issue({ value: val.value, purpose, ttlSeconds: 3600 });
};

describe('Token', () => {
  it('issues as active', () => {
    const token = makeToken();
    expect(token.status).toBe('active');
    expect(token.isValid()).toBe(true);
  });

  it('consumes an enrollment token', () => {
    const token = makeToken();
    const result = token.consume();
    expect(result.isOk()).toBe(true);
    expect(token.status).toBe('used');
  });

  it('cannot consume an API token', () => {
    const token = makeToken('api');
    const result = token.consume();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('TOKEN_NOT_CONSUMABLE');
  });

  it('revokes an active token', () => {
    const token = makeToken();
    const result = token.revoke();
    expect(result.isOk()).toBe(true);
    expect(token.status).toBe('revoked');
  });

  it('cannot revoke a used token', () => {
    const token = makeToken();
    token.consume();
    const result = token.revoke();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('TOKEN_CANNOT_REVOKE');
  });
});
