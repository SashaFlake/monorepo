import type { Token as PrismaToken } from '@prisma/client';
import { Token } from '@domain/model/token.js';
import type { TokenPurpose, TokenStatus } from '@domain/model/token.js';
import type { TokenValue } from '@domain/model/value-objects.js';
import type { EntityId } from '@domain/model/entity.js';

export class TokenMapper {
  static toDomain(row: PrismaToken): Token {
    return Token.reconstitute({
      id:         row.id         as EntityId,
      value:      row.value      as TokenValue,
      purpose:    row.purpose    as TokenPurpose,
      status:     row.status     as TokenStatus,
      issuedToId: (row.issuedToId ?? null) as EntityId | null,
      usedAt:     row.usedAt     ?? null,
      revokedAt:  row.revokedAt  ?? null,
      issuedAt:   row.issuedAt,
      expiresAt:  row.expiresAt,
      updatedAt:  row.updatedAt,
    });
  }

  static toPersistence(token: Token): PrismaToken {
    return {
      id:         token.id,
      value:      token.value,
      purpose:    token.purpose,
      status:     token.status,
      issuedToId: token.issuedToId ?? null,
      usedAt:     token.usedAt     ?? null,
      revokedAt:  token.revokedAt  ?? null,
      issuedAt:   token.issuedAt,
      expiresAt:  token.expiresAt,
      updatedAt:  token.updatedAt,
    };
  }
}
