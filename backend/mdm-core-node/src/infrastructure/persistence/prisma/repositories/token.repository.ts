import { injectable, inject } from 'tsyringe';
import { ok, err } from 'neverthrow';
import type { PrismaClient } from '@prisma/client';
import type { TokenRepositoryPort } from '@domain/port/token.repository.port.js';
import { TOKEN_REPOSITORY } from '@domain/port/token.repository.port.js';
import type { Token } from '@domain/model/token.js';
import type { TokenPurpose } from '@domain/model/token.js';
import type { TokenValue } from '@domain/model/value-objects.js';
import type { EntityId } from '@domain/model/entity.js';
import type { DomainError } from '@domain/error/domain-error.js';
import { domainError } from '@domain/error/domain-error.js';
import type { Result } from '@domain/result.js';
import { TokenMapper } from '../mappers/token.mapper.js';
import { PRISMA_CLIENT } from '../prisma-client.js';

@injectable()
export class PrismaTokenRepository implements TokenRepositoryPort {
  constructor(
    @inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
  ) {}

  async findById(id: EntityId): Promise<Result<Token | null, DomainError>> {
    try {
      const row = await this.prisma.token.findUnique({ where: { id } });
      return ok(row ? TokenMapper.toDomain(row) : null);
    } catch (e) {
      return err(domainError('REPOSITORY_ERROR', 'Failed to find token by id', { cause: e }));
    }
  }

  async findByValue(value: TokenValue): Promise<Result<Token | null, DomainError>> {
    try {
      const row = await this.prisma.token.findUnique({ where: { value } });
      return ok(row ? TokenMapper.toDomain(row) : null);
    } catch (e) {
      return err(domainError('REPOSITORY_ERROR', 'Failed to find token by value', { cause: e }));
    }
  }

  async findByIssuedToId(issuedToId: EntityId): Promise<Result<Token[], DomainError>> {
    try {
      const rows = await this.prisma.token.findMany({ where: { issuedToId } });
      return ok(rows.map(TokenMapper.toDomain));
    } catch (e) {
      return err(domainError('REPOSITORY_ERROR', 'Failed to find tokens by issuedToId', { cause: e }));
    }
  }

  async findActiveByPurpose(purpose: TokenPurpose): Promise<Result<Token[], DomainError>> {
    try {
      const rows = await this.prisma.token.findMany({
        where: {
          purpose,
          status:    'active',
          expiresAt: { gt: new Date() },
        },
      });
      return ok(rows.map(TokenMapper.toDomain));
    } catch (e) {
      return err(domainError('REPOSITORY_ERROR', 'Failed to find active tokens by purpose', { cause: e }));
    }
  }

  async save(token: Token): Promise<Result<void, DomainError>> {
    try {
      const data = TokenMapper.toPersistence(token);
      await this.prisma.token.upsert({
        where:  { id: data.id },
        create: data,
        update: data,
      });
      return ok(undefined);
    } catch (e) {
      return err(domainError('REPOSITORY_ERROR', 'Failed to save token', { cause: e }));
    }
  }

  async delete(id: EntityId): Promise<Result<void, DomainError>> {
    try {
      await this.prisma.token.delete({ where: { id } });
      return ok(undefined);
    } catch (e) {
      return err(domainError('REPOSITORY_ERROR', 'Failed to delete token', { cause: e }));
    }
  }
}

export { TOKEN_REPOSITORY };
