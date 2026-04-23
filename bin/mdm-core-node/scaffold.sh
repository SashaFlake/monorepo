#!/usr/bin/env bash
# =============================================================================
# scaffold.sh — Bootstrap mdm-core-node project
# Usage: bash scaffold.sh
# Requires: node >= 20, pnpm >= 9
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

BOLD=$(tput bold 2>/dev/null || echo '')
GREEN=$(tput setaf 2 2>/dev/null || echo '')
CYAN=$(tput setaf 6 2>/dev/null || echo '')
RESET=$(tput sgr0 2>/dev/null || echo '')

step() { echo ""; echo "${CYAN}${BOLD}▶ $1${RESET}"; }
ok()   { echo "${GREEN}✔ $1${RESET}"; }

# ---------------------------------------------------------------------------
# 1. Check prerequisites
# ---------------------------------------------------------------------------
step "Checking prerequisites"
command -v node >/dev/null 2>&1 || { echo "node not found. Install Node.js >= 20"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { npm install -g pnpm@latest; }
ok "node $(node -v), pnpm $(pnpm -v)"

# ---------------------------------------------------------------------------
# 2. Create directory structure
# ---------------------------------------------------------------------------
step "Creating directory structure"

dirs=(
  # Domain layer — zero framework dependencies
  "src/domain/model"
  "src/domain/command"
  "src/domain/port"
  "src/domain/error"
  "src/domain/event"

  # Application layer — orchestration
  "src/application/command-handler"
  "src/application/query-handler"
  "src/application/service"

  # Infrastructure layer — adapters
  "src/infrastructure/adapter"
  "src/infrastructure/persistence/prisma"
  "src/infrastructure/messaging"
  "src/infrastructure/http/client"

  # Presentation layer — delivery
  "src/presentation/routes"
  "src/presentation/middleware"
  "src/presentation/schema"

  # Composition root
  "src/container"

  # Config
  "src/config"

  # Tests
  "tests/unit/domain"
  "tests/unit/application"
  "tests/integration"
  "tests/fixtures"
)

for d in "${dirs[@]}"; do
  mkdir -p "$d"
done
ok "Directory tree created"

# ---------------------------------------------------------------------------
# 3. Write source files
# ---------------------------------------------------------------------------
step "Writing source files"

# --- tsconfig.json ---
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "paths": {
      "@domain/*":         ["./src/domain/*"],
      "@application/*":    ["./src/application/*"],
      "@infrastructure/*": ["./src/infrastructure/*"],
      "@presentation/*":   ["./src/presentation/*"],
      "@config/*":         ["./src/config/*"],
      "@container/*":      ["./src/container/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
EOF

# --- package.json ---
cat > package.json << 'EOF'
{
  "name": "mdm-core-node",
  "version": "0.1.0",
  "private": true,
  "description": "MDM Core — Node.js/TypeScript microservice (DDD + Clean Architecture)",
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": {
    "dev":          "tsx watch src/main.ts",
    "build":        "tsc -p tsconfig.json",
    "start":        "node dist/main.js",
    "test":         "vitest run",
    "test:watch":   "vitest",
    "test:coverage":"vitest run --coverage",
    "lint":         "biome check src tests",
    "lint:fix":     "biome check --write src tests",
    "typecheck":    "tsc --noEmit",
    "db:generate":  "prisma generate",
    "db:migrate":   "prisma migrate dev",
    "db:studio":    "prisma studio"
  },
  "dependencies": {
    "fastify":              "^5.0.0",
    "@fastify/cors":        "^10.0.0",
    "@fastify/helmet":      "^12.0.0",
    "@fastify/sensible":    "^6.0.0",
    "@fastify/swagger":     "^9.0.0",
    "@fastify/swagger-ui":  "^5.0.0",
    "neverthrow":           "^8.0.0",
    "tsyringe":             "^4.8.0",
    "reflect-metadata":     "^0.2.0",
    "@prisma/client":       "^6.0.0",
    "zod":                  "^3.23.0",
    "pino":                 "^9.0.0",
    "pino-pretty":          "^13.0.0",
    "dotenv":               "^16.4.0"
  },
  "devDependencies": {
    "typescript":           "^5.5.0",
    "tsx":                  "^4.16.0",
    "prisma":               "^6.0.0",
    "vitest":               "^2.0.0",
    "@vitest/coverage-v8":  "^2.0.0",
    "@biomejs/biome":       "^1.8.0",
    "@types/node":          "^22.0.0"
  }
}
EOF

# --- biome.json ---
cat > biome.json << 'EOF'
{
  "$schema": "https://biomejs.dev/schemas/1.8.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": { "noUnusedVariables": "error" },
      "suspicious":  { "noExplicitAny": "warn" }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  }
}
EOF

# --- .env.example ---
cat > .env.example << 'EOF'
# Application
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info

# Database (Postgres)
DATABASE_URL="postgresql://user:password@localhost:5432/mdm_core?schema=public"

# Redis (optional — for outbox / caching)
REDIS_URL="redis://localhost:6379"

# Auth
JWT_SECRET="change-me-in-production"
JWT_EXPIRES_IN="15m"
EOF

# --- .gitignore additions ---
cat > .gitignore << 'EOF'
node_modules/
dist/
.env
*.env.local
coverage/
.prisma/
prisma/migrations/*.sql
*.js.map
*.d.ts.map
EOF

# --- .editorconfig ---
cat > .editorconfig << 'EOF'
root = true
[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2
[*.md]
trim_trailing_whitespace = false
EOF

# ---------------------------------------------------------------------------
# Domain layer
# ---------------------------------------------------------------------------

# Result type re-export (neverthrow wrapper)
cat > src/domain/result.ts << 'EOF'
export { ok, err, Result, Ok, Err } from 'neverthrow';
export type { ResultAsync } from 'neverthrow';
EOF

# Base domain error
cat > src/domain/error/domain-error.ts << 'EOF'
export type DomainErrorCode = string;

export interface DomainError {
  readonly code: DomainErrorCode;
  readonly message: string;
  readonly context?: Record<string, unknown>;
}

export const domainError = (
  code: DomainErrorCode,
  message: string,
  context?: Record<string, unknown>,
): DomainError => ({ code, message, context });
EOF

cat > src/domain/error/index.ts << 'EOF'
export * from './domain-error.js';
EOF

# Example domain model: Entity base
cat > src/domain/model/entity.ts << 'EOF'
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
EOF

cat > src/domain/model/index.ts << 'EOF'
export * from './entity.js';
EOF

# Example command + handler interface
cat > src/domain/command/index.ts << 'EOF'
import type { Result } from '../result.js';
import type { DomainError } from '../error/index.js';

/**
 * Marker interface for all commands.
 * Commands are plain data objects describing intent.
 */
export interface Command {
  readonly _type: string;
}

/**
 * Every command handler lives in the application layer,
 * but its contract is declared here in domain.
 */
export interface CommandHandler<TCommand extends Command, TResult> {
  execute(command: TCommand): Promise<Result<TResult, DomainError>>;
}
EOF

# Port example: generic repository
cat > src/domain/port/repository.ts << 'EOF'
import type { EntityId } from '../model/index.js';
import type { Result } from '../result.js';
import type { DomainError } from '../error/index.js';

/**
 * Generic repository port — implemented in infrastructure layer.
 */
export interface Repository<T> {
  findById(id: EntityId): Promise<Result<T | null, DomainError>>;
  save(entity: T): Promise<Result<void, DomainError>>;
  delete(id: EntityId): Promise<Result<void, DomainError>>;
}
EOF

cat > src/domain/port/index.ts << 'EOF'
export * from './repository.js';
EOF

# Domain events base
cat > src/domain/event/domain-event.ts << 'EOF'
export interface DomainEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
}
EOF

cat > src/domain/event/index.ts << 'EOF'
export * from './domain-event.js';
EOF

# ---------------------------------------------------------------------------
# Application layer
# ---------------------------------------------------------------------------

# Dispatcher / Command Bus
cat > src/application/command-handler/command-bus.ts << 'EOF'
import 'reflect-metadata';
import { injectable } from 'tsyringe';
import type { Command, CommandHandler } from '@domain/command/index.js';
import type { DomainError } from '@domain/error/index.js';
import type { Result } from '@domain/result.js';

type AnyCommandHandler = CommandHandler<Command, unknown>;

@injectable()
export class CommandBus {
  private readonly handlers = new Map<string, AnyCommandHandler>();

  register<TCommand extends Command, TResult>(
    commandType: string,
    handler: CommandHandler<TCommand, TResult>,
  ): void {
    this.handlers.set(commandType, handler as AnyCommandHandler);
  }

  async execute<TCommand extends Command, TResult>(
    command: TCommand,
  ): Promise<Result<TResult, DomainError>> {
    const handler = this.handlers.get(command._type);
    if (!handler) {
      throw new Error(`No handler registered for command: ${command._type}`);
    }
    return handler.execute(command) as Promise<Result<TResult, DomainError>>;
  }
}
EOF

cat > src/application/command-handler/index.ts << 'EOF'
export * from './command-bus.js';
EOF

# ---------------------------------------------------------------------------
# Infrastructure — Prisma client singleton
# ---------------------------------------------------------------------------
mkdir -p prisma
cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Add your models here
// model ExampleEntity {
//   id        String   @id @default(uuid())
//   createdAt DateTime @default(now())
//   updatedAt DateTime @updatedAt
// }
EOF

cat > src/infrastructure/persistence/prisma/prisma-client.ts << 'EOF'
import { PrismaClient } from '@prisma/client';
import { injectable } from 'tsyringe';

let instance: PrismaClient | null = null;

@injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      log: process.env['NODE_ENV'] === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    });
  }

  static getInstance(): PrismaService {
    if (!instance) {
      instance = new PrismaService();
    }
    return instance as PrismaService;
  }
}
EOF

cat > src/infrastructure/persistence/prisma/index.ts << 'EOF'
export * from './prisma-client.js';
EOF

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
cat > src/config/env.ts << 'EOF'
import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  NODE_ENV:     z.enum(['development', 'production', 'test']).default('development'),
  PORT:         z.coerce.number().default(3000),
  HOST:         z.string().default('0.0.0.0'),
  LOG_LEVEL:    z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET:   z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('15m'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:\n', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
EOF

cat > src/config/index.ts << 'EOF'
export * from './env.js';
EOF

# ---------------------------------------------------------------------------
# Container (DI composition root)
# ---------------------------------------------------------------------------
cat > src/container/tokens.ts << 'EOF'
export const TOKENS = {
  CommandBus:    Symbol('CommandBus'),
  PrismaService: Symbol('PrismaService'),
  // Add more tokens as you register handlers / adapters
} as const;
EOF

cat > src/container/index.ts << 'EOF'
import 'reflect-metadata';
import { container } from 'tsyringe';
import { PrismaService } from '@infrastructure/persistence/prisma/index.js';
import { CommandBus } from '@application/command-handler/index.js';
import { TOKENS } from './tokens.js';

container.registerSingleton(TOKENS.PrismaService, PrismaService);
container.registerSingleton(TOKENS.CommandBus,    CommandBus);

// Register command handlers here:
// container.register('CreateFooHandler', { useClass: CreateFooCommandHandler });
// commandBus.register('CreateFoo', container.resolve('CreateFooHandler'));

export { container };
EOF

# ---------------------------------------------------------------------------
# Presentation — Fastify app factory
# ---------------------------------------------------------------------------
cat > src/presentation/app.ts << 'EOF'
import Fastify from 'fastify';
import cors    from '@fastify/cors';
import helmet  from '@fastify/helmet';
import sensible from '@fastify/sensible';
import swagger   from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env } from '@config/index.js';
import { healthRoutes } from './routes/health.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level:     env.LOG_LEVEL,
      transport: env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
  });

  // Plugins
  await app.register(cors,    { origin: false });
  await app.register(helmet);
  await app.register(sensible);

  // OpenAPI
  await app.register(swagger, {
    openapi: {
      info: { title: 'MDM Core API', version: '0.1.0', description: 'Master Data Management Core' },
    },
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  // Routes
  await app.register(healthRoutes, { prefix: '/api/v1' });

  return app;
}
EOF

# Health route
cat > src/presentation/routes/health.ts << 'EOF'
import type { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', { schema: { tags: ['system'] } }, async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));
};
EOF

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
cat > src/main.ts << 'EOF'
import 'reflect-metadata';
import './container/index.js';
import { buildApp } from './presentation/app.js';
import { env } from './config/index.js';

const app = await buildApp();

try {
  await app.listen({ port: env.PORT, host: env.HOST });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
EOF

# ---------------------------------------------------------------------------
# Tests scaffold
# ---------------------------------------------------------------------------
cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    globals:     true,
    environment: 'node',
    coverage: {
      provider:   'v8',
      reporter:   ['text', 'lcov'],
      include:    ['src/**/*.ts'],
      exclude:    ['src/main.ts', 'src/container/**'],
    },
  },
  resolve: {
    alias: {
      '@domain':         resolve(__dirname, 'src/domain'),
      '@application':    resolve(__dirname, 'src/application'),
      '@infrastructure': resolve(__dirname, 'src/infrastructure'),
      '@presentation':   resolve(__dirname, 'src/presentation'),
      '@config':         resolve(__dirname, 'src/config'),
      '@container':      resolve(__dirname, 'src/container'),
    },
  },
});
EOF

# Example unit test
cat > tests/unit/domain/entity.test.ts << 'EOF'
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
EOF

# ---------------------------------------------------------------------------
# README
# ---------------------------------------------------------------------------
cat > README.md << 'EOF'
# mdm-core-node

Node.js / TypeScript реализация MDM Core сервиса.  
Архитектура: **Clean Architecture + DDD** (команды, порты, адаптеры).

## Стек

| Роль | Библиотека |
|---|---|
| HTTP-фреймворк | [Fastify v5](https://fastify.dev) |
| Язык | TypeScript 5, NodeNext modules |
| DI-контейнер | [tsyringe](https://github.com/microsoft/tsyringe) |
| Result-type | [neverthrow](https://github.com/supermacro/neverthrow) |
| ORM | [Prisma](https://www.prisma.io) |
| Валидация | [Zod](https://zod.dev) |
| Тесты | [Vitest](https://vitest.dev) |
| Linter/Formatter | [Biome](https://biomejs.dev) |

## Быстрый старт

```bash
bash scaffold.sh        # первый запуск — создаёт структуру и ставит зависимости
cp .env.example .env    # заполни DATABASE_URL и JWT_SECRET
pnpm db:generate        # сгенерировать Prisma client
pnpm db:migrate         # применить миграции
pnpm dev                # запустить в dev-режиме (hot-reload)
```

## Структура

```
src/
├── domain/                 # Чистая бизнес-логика — ноль фреймворков
│   ├── model/              # Entities, Value Objects
│   ├── command/            # Интерфейсы команд и хендлеров
│   ├── port/               # Интерфейсы репозиториев и внешних сервисов
│   ├── event/              # Domain events
│   └── error/              # DomainError type
│
├── application/            # Оркестрация use-cases
│   ├── command-handler/    # CommandBus + конкретные хендлеры
│   ├── query-handler/      # CQRS query side
│   └── service/            # Application services
│
├── infrastructure/         # Реализации портов
│   ├── adapter/            # Адаптеры внешних API / очередей
│   ├── persistence/prisma/ # Prisma репозитории
│   ├── messaging/          # Брокеры (Redis / RabbitMQ / Kafka)
│   └── http/client/        # HTTP-клиенты внешних сервисов
│
├── presentation/           # Delivery layer
│   ├── routes/             # Fastify route plugins
│   ├── middleware/         # Auth, logging, rate-limit hooks
│   └── schema/             # Zod схемы запросов/ответов
│
├── container/              # Composition root (tsyringe)
├── config/                 # Env validation (Zod)
└── main.ts                 # Entry point
```

## Архитектурные правила

- **`domain/`** — нет зависимостей на Fastify / Prisma / tsyringe. Только `neverthrow` и стандартные модули Node.
- **Порты** — интерфейсы в `domain/port/`, реализации в `infrastructure/adapter/`.
- **Хендлеры** возвращают `Result<T, DomainError>` — никаких `throw` для бизнес-ошибок.
- **DI** — вся сборка в `src/container/index.ts`. Нигде больше `new` для сервисов.
- **Каждая операция** — counter (attempt / success / failure) в `presentation/middleware/metrics.ts`.
EOF

ok "All source files written"

# ---------------------------------------------------------------------------
# 4. Install dependencies
# ---------------------------------------------------------------------------
step "Installing dependencies (pnpm install)"
pnpm install
ok "Dependencies installed"

# ---------------------------------------------------------------------------
# 5. Done
# ---------------------------------------------------------------------------
echo ""
echo "${GREEN}${BOLD}════════════════════════════════════════"
echo "  mdm-core-node scaffold complete! 🎉"
echo "════════════════════════════════════════${RESET}"
echo ""
echo "Next steps:"
echo "  1. cp .env.example .env   # set DATABASE_URL and JWT_SECRET"
echo "  2. pnpm db:generate       # generate Prisma client"
echo "  3. pnpm db:migrate        # run DB migrations"
echo "  4. pnpm dev               # start dev server on :3000"
echo "  5. open http://localhost:3000/docs"
echo ""
