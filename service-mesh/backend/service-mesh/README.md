# Service Mesh — Control Plane API (Backend)

> Control Plane backend. Modular monolith on Fastify + TypeScript.
> This README describes the backend architecture for AI agents and developers.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [Bounded Contexts](#bounded-contexts)
- [Common Patterns](#common-patterns)
- [File Naming Conventions](#file-naming-conventions)
- [API Overview](#api-overview)
- [Commands](#commands)
- [Environment Variables](#environment-variables)
- [Testing](#testing)

---

## Overview

Control Plane API for the Service Mesh. Manages the service registry, routing rules, and configuration distribution to data plane nodes.

**MVP scope:**
- **Service Registry** — registration, heartbeat, health status, lookup
- **Routing Rules** — CRUD for weighted routing and canary rules
- **Config Distribution** — mock service pulls rules and applies them

**Out of scope:** Auth / JWT, Policies (retry, circuit breaker, timeout), Revisions / Config history, PostgreSQL persistence (currently in-memory).

Architecture: **Domain-Driven Design (DDD)** with strict layer separation. Business logic returns `Result<T, E>` via neverthrow. No exceptions for control flow.

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Node.js | >= 20 | Runtime, native test runner |
| Fastify | ^5.0.0 | HTTP framework, plugin ecosystem |
| TypeScript | ~5.7.2 | Type safety, strict mode |
| Zod | ^3.23.0 | Schema validation, runtime + static types |
| neverthrow | ^8.0.0 | Explicit error handling (`Result<T, E>`) |
| Pino (pino-pretty) | ^13.0.0 | Structured JSON logging |
| fastify-type-provider-zod | ^4.0.0 | Zod type provider for Fastify |
| @fastify/cors | ^10.0.0 | CORS support |
| @fastify/sensible | ^6.0.0 | Sensible defaults (HTTP errors) |
| @fastify/swagger | ^9.0.0 | OpenAPI spec generation |
| @fastify/swagger-ui | ^5.0.0 | Swagger UI documentation |
| dotenv | ^16.4.0 | Environment variable loading |
| tsx | ^4.16.0 | TypeScript execution without compilation |

---

## Architecture

Each module is divided into **layers**. Dependencies point inward: Presentation → Application → Domain.

### Layers

| Layer | Directory | Responsibility | Dependencies |
|---|---|---|---|
| **Domain** | `domain/` | Pure types, branded types, value objects, pure functions | None (zero framework dependencies) |
| **Application** | `application/` | Use cases, in-memory stores, orchestration | Domain layer, neverthrow |
| **Presentation** | `presentation/` | Fastify routes, handlers, Zod DTOs, contract mapping | Application layer, Fastify, Zod |
| **Infrastructure** | `infrastructure/` | DB adapters, external API clients, message queues | Application layer (future) |

### Principles

- **Pure domain functions** — No dependencies on Fastify, Zod, or neverthrow (types only).
- **Result<T, E> error handling** — Services return `Result` via neverthrow. Handlers explicitly check `result.isOk()` / `result.isErr()` and map to HTTP status codes.
- **EndpointContract** — Single source of truth for each endpoint: `method`, `path`, `summary`, `body?`, `params?`, `query?`, `response` (ZodTypeAny).
- **Branded types for IDs** — `type ServiceId = string & { readonly _brand: 'ServiceId' }`.
- **In-memory store** — `RegistryService` uses `Map<ServiceId, Service>` and `Map<InstanceId, Instance>`. GC is intentionally removed: instances live until explicit DELETE.

---

## Directory Structure

```
src/
├── main.ts                              # Entry point: builds app, starts server
├── config/
│   └── env.ts                           # Zod-validated environment variables
│
├── shared/
│   └── endpoint-contract.ts             # Typed API contract interface
│
├── presentation/
│   └── app.ts                           # Fastify app factory (plugins, routes)
│
└── modules/
    ├── registry/                          # Bounded context: Service Registry
    │   ├── domain/
    │   │   ├── model.ts                   # Service, Instance, branded types,
    │   │   │                            #   deriveStatus, toServiceView, toInstanceView
    │   │   └── errors.ts                  # RegistryErrorCode, RegistryError type
    │   ├── application/
    │   │   ├── registry.service.ts        # RegistryService: create, delete, lookup,
    │   │   │                            #   registerInstance, heartbeat, deregister,
    │   │   │                            #   recordHealthCheck
    │   │   └── health-checker.ts          # ActiveHealthChecker: periodic HTTP health probes
    │   └── presentation/
    │       ├── routes.ts                  # Fastify route registration
    │       ├── handlers/
    │       │   ├── service.handlers.ts    # POST /services, GET /services, GET /services/:id,
    │       │   │                        #   DELETE /services/:id
    │       │   └── instance.handlers.ts   # POST /instances, POST /instances/:id/heartbeat,
    │       │                            #   DELETE /instances/:id
    │       └── contracts/
    │           ├── index.ts               # Barrel export
    │           ├── service.contracts.ts   # Zod schemas for service endpoints
    │           └── instance.contracts.ts  # Zod schemas for instance endpoints
    │
    └── routing-rules/                     # Bounded context: Routing Rules
        ├── domain/
        │   ├── routing-rule.ts            # RoutingRule, RoutingRuleMatch,
        │   │                            #   RoutingRuleDestination, DTO types
        │   └── errors.ts                  # RoutingRuleError type
        ├── application/
        │   ├── routing-rule.service.ts    # Interface: RoutingRuleService
        │   ├── routing-rule.service.impl.ts # Implementation: list, create, update, delete
        │   └── routing-rule.service.test.ts # Unit tests for service logic
        └── presentation/
            ├── routes.ts                  # Fastify route registration
            ├── handlers/
            │   └── routing-rule.handlers.ts # CRUD handlers for routing rules
            └── contracts/
                └── routing-rule.contracts.ts # Zod schemas + EndpointContract definitions
```

---

## Bounded Contexts

### Registry

Manages the lifecycle of services and their instances.

- **Service** — Aggregate root. Logical service: `id`, `name`, `labels`, `registeredAt`.
- **Instance** — Entity. Concrete pod: `id`, `serviceId`, `host`, `port`, `healthPath`, `metadata`, `lastHeartbeatAt`, `lastHealthCheck`.
- **deriveStatus** — Pure function that computes `InstanceStatus` (`passing` / `warning` / `critical`) from heartbeat TTL and last health check.
- **RegistryService** — Application service. In-memory Map storage. Upsert by `name+labels` to prevent duplicates.
- **ActiveHealthChecker** — Periodically probes instance health endpoints and records results.

### Routing Rules

Manages weighted routing and canary rules per service.

- **RoutingRule** — Aggregate root. `id`, `serviceId`, `name`, `priority`, `match`, `destinations`.
- **RoutingRuleMatch** — Value object. `headers?`, `pathPrefix?`.
- **RoutingRuleDestination** — Value object. `version?`, `weightPct`.
- **RoutingRuleService** — Interface + implementation. CRUD operations returning `Result<RoutingRule, RoutingRuleError>`.

---

## Common Patterns

### EndpointContract

Single source of truth for an API endpoint. Used for validation, handler type inference, and future OpenAPI generation.

```typescript
// shared/endpoint-contract.ts
export interface EndpointContract<
  TBody extends ZodTypeAny = ZodTypeAny,
  TParams extends ZodTypeAny = ZodTypeAny,
  TQuery extends ZodTypeAny = ZodTypeAny,
  TResponse extends ZodTypeAny = ZodTypeAny,
> {
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  readonly path: string;
  readonly summary: string;
  readonly tags?: string[];
  readonly body?: TBody;
  readonly params?: TParams;
  readonly query?: TQuery;
  readonly response: TResponse;
}
```

### Branded Types

Prevent raw strings from leaking into domain logic.

```typescript
// modules/registry/domain/model.ts
export type ServiceId = string & { readonly _brand: 'ServiceId' };
export type InstanceId = string & { readonly _brand: 'InstanceId' };

export const serviceId = (v: string): ServiceId => v as ServiceId;
export const instanceId = (v: string): InstanceId => v as InstanceId;
```

### Explicit Error Handling

Services return `Result<T, ErrorType>`. Handlers map to HTTP status codes.

```typescript
// Application layer
import { ok, err } from 'neverthrow';

createService(input: CreateServiceInput): Result<ServiceView, RegistryError> {
  if (exists) return ok(existingView);
  // ... create ...
  return ok(toServiceView(svc, [], this.ttlMs));
}

// Presentation layer
const result = registry.createService(parsed.data);
if (result.isErr()) {
  return reply.status(404).send({
    error: result.error.code,
    message: result.error.message,
  });
}
return reply.status(201).send(result.value);
```

### Pure Domain Functions

No framework dependencies. Deterministic, immutable.

```typescript
// domain/model.ts
export const deriveStatus = (instance: Instance, ttlMs: number): InstanceStatus => {
  const elapsed = Date.now() - instance.lastHeartbeatAt.getTime();
  const ttlStatus: InstanceStatus =
    elapsed < ttlMs / 2 ? 'passing' :
    elapsed < ttlMs     ? 'warning' :
    'critical';

  const hcStatus: InstanceStatus =
    instance.lastHealthCheck?.ok ?? true ? 'passing' : 'critical';

  if (ttlStatus === 'critical' || hcStatus === 'critical') return 'critical';
  if (ttlStatus === 'warning') return 'warning';
  return 'passing';
};
```

---

## File Naming Conventions

| Pattern | Purpose |
|---|---|
| `*.domain.ts` | Domain logic: pure functions, entities, value objects |
| `*.types.ts` | Domain types, interfaces, type aliases |
| `*.application.ts` | Application services, use cases, orchestration |
| `*.dto.ts` | Data transfer objects, validation schemas (Zod) |
| `*.infrastructure.ts` | Infrastructure adapters (DB, HTTP, external APIs) |
| `*.repository.ts` | Data access implementations |
| `*.controller.ts` | Presentation layer: HTTP handlers |
| `*.routes.ts` | Route definitions (Fastify plugin registration) |
| `*.handlers.ts` | Request handlers ( Fastify route handlers) |
| `*.contracts.ts` | API contracts: Zod schemas + EndpointContract |
| `*.test.ts` | Unit / integration tests (co-located) |
| `*.spec.ts` | Specification / contract tests |
| `*.fixture.ts` | Test data builders |
| `README.md` | Module-level documentation |

---

## API Overview

All endpoints are prefixed with `/api/v1` unless noted.

### Registry

| Method | Path | Description | Body | Response |
|---|---|---|---|---|
| `POST` | `/services` | Create a service | `{ name, labels? }` | `ServiceView` |
| `GET` | `/services` | List all services (filter by name/labels) | — | `ServiceView[]` |
| `GET` | `/services/:id` | Get service detail with instances | — | `ServiceView` |
| `DELETE` | `/services/:id` | Delete service and its instances | — | `204` |
| `POST` | `/instances` | Register an instance | `{ serviceId, host, port, healthPath?, metadata? }` | `InstanceView` |
| `POST` | `/instances/:id/heartbeat` | Send heartbeat | — | `204` |
| `DELETE` | `/instances/:id` | Deregister an instance | — | `204` |

### Routing Rules

| Method | Path | Description | Body | Response |
|---|---|---|---|---|
| `GET` | `/services/:serviceId/routing-rules` | List rules for service | — | `RoutingRule[]` |
| `POST` | `/services/:serviceId/routing-rules` | Create rule | `CreateRoutingRuleDto` | `RoutingRule` |
| `PUT` | `/routing-rules/:id` | Update rule | `UpdateRoutingRuleDto` | `RoutingRule` |
| `DELETE` | `/routing-rules/:id` | Delete rule | — | `204` |

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Control Plane health check |

---

## Commands

```bash
# Install dependencies
npm install

# Dev server (tsx watch) → http://localhost:4000
npm run dev

# Production build
npm run build       # tsc -p tsconfig.json → dist/

# Start production build
npm start           # node dist/main.js

# Type-check
npm run typecheck   # tsc --noEmit

# Tests
npm run test        # tsx --test src/**/*.test.ts

# Lint
npm run lint        # eslint src
npm run lint:fix    # eslint src --fix
```

---

## Environment Variables

Validated via Zod in `config/env.ts`. Invalid variables cause `process.exit(1)` on startup.

| Variable | Type | Default | Description |
|---|---|---|---|
| `NODE_ENV` | `development` \| `production` \| `test` | `development` | Runtime environment |
| `PORT` | number | `4000` | HTTP server port |
| `HOST` | string | `0.0.0.0` | HTTP server host |
| `LOG_LEVEL` | `fatal` \| `error` \| `warn` \| `info` \| `debug` \| `trace` | `info` | Pino log level |
| `INSTANCE_TTL_SECONDS` | number | `30` | Instance heartbeat TTL in seconds |

---

## Testing

- **Runner:** Node.js built-in test runner via `tsx`
- **Location:** Co-located next to source files (`*.test.ts`)
- **Coverage target:** ≥ 80%

**Test categories:**

| Layer | File pattern | Example |
|---|---|---|
| Domain | `domain/*.test.ts` | Pure function unit tests |
| Application | `application/*.test.ts` | Service integration tests |
| Presentation | `presentation/*.http.test.ts` | HTTP handler tests |

**Example: run routing-rules service tests**

```bash
npx tsx --test src/modules/routing-rules/application/routing-rule.service.test.ts
```
