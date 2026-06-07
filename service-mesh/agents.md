# AGENTS.md — Service Mesh Control Plane

> This document is the single source of truth for AI agents working on the Service Mesh Control Plane codebase. It is optimized for RAG retrieval and structured for chunk-friendly comprehension. Read this file before modifying any code.

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [DDD + FP Foundation](#ddd--fp-foundation)
- [Monorepo Structure](#monorepo-structure)
- [Architecture](#architecture)
  - [Backend — Domain-Driven Design](#backend--domain-driven-design)
  - [Frontend — DDD-Inspired + Local-First](#frontend--ddd-inspired--local-first)
- [Bounded Contexts & Module Map](#bounded-contexts--module-map)
- [RAG Indexing Strategy](#rag-indexing-strategy)
- [File Naming Conventions](#file-naming-conventions)
- [Common Patterns](#common-patterns)
- [Anti-Patterns](#anti-patterns)
- [Entry Points for Common Tasks](#entry-points-for-common-tasks)
- [Environment Setup](#environment-setup)
- [Agent Configuration Files](#agent-configuration-files)

---

## Project Overview

**Service Mesh Control Plane** is an educational MVP that implements a control plane for a service mesh. It manages a registry of services, distributes routing rules to data plane nodes, and provides an operator UI.

```
┌─────────────────────────────────────────┐
│              Control Plane              │
│   ┌──────────┐     ┌────────────────┐   │
│   │ Admin UI │────▶│    Backend     │   │
│   │ (React)  │     │   (Fastify)    │   │
│   └──────────┘     └───────┬────────┘   │
│                            │            │
└────────────────────────────┼────────────┘
                             │ REST (pull)
                    ┌────────▼────────┐
                    │  Data Plane     │
                    │  (mock-service) │
                    └─────────────────┘
```

**MVP scope:**
- **Service Registry** — registration, heartbeat, health status, lookup
- **Routing Rules** — CRUD for routing rules (weighted routing, canary)
- **Config Distribution** — mock service pulls rules and applies them
- **Admin UI** — Dashboard, Services, Routes

**Out of scope:** Auth / JWT, Policies (retry, circuit breaker, timeout), Revisions / Config history, PostgreSQL persistence (currently in-memory).

---

## Tech Stack

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Backend runtime | Node.js | >= 20 | Native test runner, modern ESM |
| HTTP framework | Fastify | ^5.0.0 | High performance, plugin ecosystem |
| Language | TypeScript | ~5.7.2 | Strict mode, branded types |
| Validation | Zod | ^3.23.0 | Schema-first, runtime + static types |
| Result type | neverthrow | ^8.0.0 | Explicit error handling without exceptions |
| Logging | Pino (pino-pretty) | ^13.0.0 | Structured, performant JSON logging |
| Frontend framework | React | ^19.0.0 | StrictMode, modern hooks |
| Bundler | Vite | ^6.0.5 | Fast HMR, ESM-first |
| Routing | TanStack Router | ^1.95.0 | File-based, type-safe routing |
| Server state | TanStack Query + persist | ^5.62.0 | Caching, background sync, offline-first |
| Global state | Zustand | ^5.0.2 | Minimal boilerplate, TypeScript-friendly |
| Side effects | Effect | ^3.12.0 | Composable, type-safe async pipelines |
| CSS | CSS custom properties + CSS Modules | vanilla | Design tokens, scoped styles, no Tailwind |
| UI primitives | Radix UI | ^1.1.x | Accessible, unstyled headless components |
| Icons | Lucide React | ^0.468.0 | Consistent, tree-shakeable icon set |
| Toasts | Sonner | ^1.7.4 | Lightweight toast notifications |
| Backend testing | Node.js built-in test runner | — | Co-located tests via `tsx` |
| Frontend testing | Vitest + jsdom + React Testing Library | ^2.0.0 | Fast, browser-like environment |
| Lint | ESLint + typescript-eslint + eslint-plugin-fp | ^10.x | FP enforcement, no mutations |
| Dev runner | tsx | ^4.16.0 | TypeScript execution without compilation |
| Containers | Docker, Docker Compose | — | Local replication |
| Orchestration | k3s (Kubernetes) | — | Lightweight K8s distribution |
| IaC | Terraform | — | Cloud infrastructure provisioning |
| Package mgmt | Helm | — | Kubernetes package management |
| Monitoring | Prometheus + Grafana | — | Metrics collection and visualization |

**Key ADRs:** See `.claude/backend.md`, `.claude/frontend.md`, `.claude/infra.md` for technology-specific decisions.

---

## DDD + FP Foundation

### Domain-Driven Design

#### Bounded Contexts

The codebase is organized by bounded contexts. Each context owns its own domain language, types, and business invariants.

| Context | Location | Responsibility |
|---|---|---|
| `registry` | `backend/service-mesh/src/modules/registry/` | Service and instance lifecycle, heartbeat, health aggregation |
| `routing-rules` | `backend/service-mesh/src/modules/routing-rules/` | CRUD for weighted routing and canary rules |
| `registry-ui` | `frontend/service-mesh/src/features/registry/` | Dashboard, services table, stats grid |
| `services-ui` | `frontend/service-mesh/src/features/services/` | Service list, service detail page |
| `routing-rules-ui` | `frontend/service-mesh/src/features/routing-rules/` | Rules table, rule forms, weight visualization |

**Boundary rules:**
- A bounded context must not import domain types from another context's `domain/` layer.
- Cross-context communication happens through the application layer or shared kernel (`shared/endpoint-contract.ts`).
- The frontend mirrors backend contexts in `features/`.

#### Ubiquitous Language

| Term | Definition | Context |
|---|---|---|
| **Service** | Logical service definition (name, labels). Aggregate root. | Registry |
| **Instance** | Concrete running pod of a Service. Child entity. | Registry |
| **ServiceId** | Branded type identifying a Service. | Registry |
| **InstanceId** | Branded type identifying an Instance. | Registry |
| **Heartbeat** | Periodic ping from an instance to prove liveness. | Registry |
| **InstanceStatus** | Derived state: `passing`, `warning`, `critical`. | Registry |
| **RoutingRule** | Rule matching requests and directing to weighted destinations. | Routing Rules |
| **Destination** | Target version + weight percentage within a rule. | Routing Rules |
| **EndpointContract** | Typed API contract: method, path, Zod schemas, response. | Shared |
| **Control Plane** | The backend API that manages registry and rules. | System |
| **Data Plane** | The mock-service node that pulls rules and proxies traffic. | System |

#### Aggregate Roots, Entities, Value Objects

**Registry context:**
- **Aggregate Root:** `Service` — owns its lifecycle and consistency boundaries.
- **Entity:** `Instance` — has identity (`InstanceId`), belongs to exactly one `Service`.
- **Value Objects:** `Labels` (Record<string, string>), `HealthCheckResult` (snapshot of a check).

**Routing Rules context:**
- **Aggregate Root:** `RoutingRule` — owned by a `serviceId`, contains destinations.
- **Value Objects:** `RoutingRuleMatch`, `RoutingRuleDestination`.

All value objects are immutable. Entities are modified only through domain functions or application service methods that return new copies.

#### Domain Services vs Application Services

| Aspect | Domain Service | Application Service |
|---|---|---|
| Location | `domain/` | `application/` |
| Dependencies | None (pure functions) | In-memory stores, repositories, domain services |
| Return type | Plain values | `Result<T, ErrorType>` (neverthrow) |
| Example | `deriveStatus(instance, ttlMs)` | `RegistryService.createService(input)` |

**Rule:** Domain services contain pure logic. Application services orchestrate and handle side effects (e.g., mutating an in-memory Map).

#### Repository Pattern and Infrastructure Boundaries

- **Current implementation:** In-memory Maps (`Map<ServiceId, Service>`, `Map<InstanceId, Instance>`).
- **Interface:** The application layer owns the storage contract. Infrastructure implements it.
- **Future:** PostgreSQL persistence is out of MVP scope but must fit the existing repository interface without changing domain or application layers.

#### Anti-Corruption Layers

- **Zod schemas** in `presentation/contracts/` act as ACLs for HTTP input.
- **Effect's `Schema`** in frontend `domain/schema.ts` validates forms before they reach the API.
- **Branded type constructors** (`serviceId()`, `instanceId()`) prevent raw strings from leaking into domain logic.

### Functional Programming

#### Core Principles

1. **Pure functions as default** — deterministic, no side effects, same input → same output.
2. **Immutability** — never mutate shared state. Use spread syntax or `Map` operations that return new references.
3. **Function composition over inheritance** — compose small functions instead of class hierarchies.
4. **Explicit error handling** — `Result<T, E>` via neverthrow. No exceptions for control flow.
5. **Dependency injection via function parameters** — no global singletons for business logic.
6. **Avoid classes for business logic** — use modules with exported functions. Classes are permitted only for stateful application services (e.g., `RegistryService`) when they encapsulate in-memory stores.

**Example: pure domain function**

```typescript
// backend/service-mesh/src/modules/registry/domain/model.ts
export const deriveStatus = (
  instance: Instance,
  ttlMs: number,
): InstanceStatus => {
  const elapsed = Date.now() - instance.lastHeartbeatAt.getTime();
  const ttlStatus: InstanceStatus =
    elapsed < ttlMs / 2 ? 'passing' :
    elapsed < ttlMs     ? 'warning' :
    'critical';

  const hcStatus: InstanceStatus =
    instance.lastHealthCheck === null ? 'passing' :
    instance.lastHealthCheck.ok       ? 'passing' :
    'critical';

  if (ttlStatus === 'critical' || hcStatus === 'critical') return 'critical';
  if (ttlStatus === 'warning')                             return 'warning';
  return 'passing';
};
```

**Example: explicit error handling in application service**

```typescript
// backend/service-mesh/src/modules/registry/application/registry.service.ts
import { ok, err } from 'neverthrow';

createService(input: CreateServiceInput): Result<ServiceView, RegistryError> {
  // ...logic...
  if (!this.services.has(sid)) {
    return err(registryError('SERVICE_NOT_FOUND', `Service ${id} not found`));
  }
  return ok(toServiceView(svc, instances, this.ttlMs));
}
```

---

## Monorepo Structure

```
service-mesh/
├── backend/
│   ├── service-mesh/          # Control Plane API (Fastify + TypeScript)
│   │   ├── src/
│   │   │   ├── config/env.ts              # Zod-validated environment
│   │   │   ├── main.ts                    # Entry point
│   │   │   ├── presentation/app.ts        # Fastify factory
│   │   │   ├── shared/endpoint-contract.ts# Typed API contract
│   │   │   └── modules/
│   │   │       ├── registry/              # Bounded context: registry
│   │   │       │   ├── domain/            # Types, branded types, pure functions
│   │   │       │   ├── application/       # RegistryService, health-checker
│   │   │       │   └── presentation/      # Routes, handlers, Zod contracts
│   │   │       └── routing-rules/         # Bounded context: routing rules
│   │   │           ├── domain/
│   │   │           ├── application/
│   │   │           └── presentation/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json      # strict, noUncheckedIndexedAccess, NodeNext
│   │   └── eslint.config.js
│   ├── mock-service/          # Data plane node simulation
│   │   ├── src/index.ts       # Self-registration, heartbeat, health endpoint
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── docker-compose.yml
├── frontend/
│   └── service-mesh/          # Admin UI (React + Vite)
│       ├── src/
│       │   ├── main.tsx                     # React 19 StrictMode entry
│       │   ├── index.css                    # Design tokens (CSS custom properties)
│       │   ├── routes/                      # File-based TanStack Router
│       │   ├── components/layout/           # Header, Sidebar
│       │   ├── features/
│       │   │   ├── registry/                # Dashboard, ServicesTable, StatsGrid
│       │   │   ├── services/                # ServicesPage, ServiceDetailPage
│       │   │   └── routing-rules/           # Domain / application / infrastructure / ui
│       │   ├── shared/
│       │   │   ├── ui/                      # Design system primitives
│       │   │   └── table/                   # Reusable DataTable
│       │   ├── lib/
│       │   │   ├── http.ts                  # Effect + Promise fetch client
│       │   │   ├── queryClient.ts           # TanStack Query + localStorage persist
│       │   │   └── persister.ts             # idb-keyval / localStorage persister
│       │   └── store/
│       │       └── ui.ts                    # Zustand UI state
│       ├── Dockerfile         # Multi-stage → nginx:1.27-alpine
│       ├── package.json
│       ├── vite.config.ts     # TanStackRouterVite + @vitejs/plugin-react
│       ├── vitest.config.ts   # jsdom, setupFiles: ./src/test/setup.ts
│       ├── tsconfig.json      # Project references (app + node)
│       └── eslint.config.js
├── infra/
│   ├── docker-compose.yaml    # Local stand: nginx, prometheus, grafana, dragonfly, cadvisor
│   ├── Dockerfile
│   ├── helm/
│   │   └── auth-service/      # Helm chart (deployment, ingress, hpa, servicemonitor)
│   ├── ops/
│   │   ├── grafana/provisioning/
│   │   ├── nginx/nginx.conf
│   │   └── prometheus/prometheus.yml
│   └── terraform/             # IaC for Cloud.ru k3s cluster
│       ├── providers.tf, variables.tf, versions.tf
│       ├── k3s.tf, ingress-nginx.tf, cert-manager.tf, letsencrypt.tf
│       ├── monitoring.tf, auth-service.tf, helm-deps.tf
│       └── terraform.tfvars.example
├── docker-compose.service-mesh.yml  # Full stand: registry + 2×mock + UI
├── .claude/
│   ├── backend.md             # Backend agent config (DDD, FP, neverthrow, Zod)
│   ├── frontend.md            # Frontend agent config (React 19, local-first, CSS Modules)
│   ├── infra.md               # Infra agent config (Terraform, Helm, k3s)
│   └── config.md              # Common style rules, testing, models
└── AGENTS.md                  # This file
```

---

## Architecture

### Backend — Domain-Driven Design

Each module is divided into layers:

| Layer | Directory | Responsibility | Dependencies |
|---|---|---|---|
| Domain | `domain/` | Pure types, branded types, value objects, domain functions | None (zero framework deps) |
| Application | `application/` | Use cases, in-memory stores, orchestration | Domain layer, neverthrow |
| Presentation | `presentation/` | Fastify routes, handlers, Zod DTOs, contract mapping | Application layer, Fastify, Zod |
| Infrastructure | `infrastructure/` | DB adapters, external API clients, message queues | Application layer (future) |

**Key patterns:**
- **Branded types** for IDs: `type ServiceId = string & { readonly _brand: 'ServiceId' }`.
- **EndpointContract** — single source of truth for each endpoint: `method`, `path`, `summary`, `body?`, `params?`, `query?`, `response` (ZodTypeAny).
- **Error handling** — services return `Result<T, ErrorType>`. Handlers explicitly check `result.isOk()` / `result.isErr()` and map to HTTP status codes.
- **In-memory store** — `RegistryService` uses `Map<ServiceId, Service>` and `Map<InstanceId, Instance>`. GC is intentionally removed: instances live until explicit DELETE.

**Example: EndpointContract**

```typescript
// backend/service-mesh/src/shared/endpoint-contract.ts
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

### Frontend — DDD-Inspired + Local-First

Code is organized by features and layers:

| Layer | Directory | Responsibility |
|---|---|---|
| Domain | `domain/` | Types, schemas, pure functions, business logic |
| Application | `application/` | Hooks, use cases, state management (TanStack Query hooks) |
| Infrastructure | `infrastructure/` | API clients, HTTP requests, mocks |
| UI | `ui/` | React components, pages, CSS Modules |
| Shared | `shared/` | Design system primitives, reusable tables, utilities |
| Routes | `routes/` | File-based TanStack Router definitions |

**Key patterns:**
- **Local-first** — data is cached in `localStorage` via TanStack Query persist (`query-sync-storage-persister`).
- **Effect for HTTP** — `lib/http.ts` provides `apiFetchEffect<T>()` (Effect pipeline) and `apiFetch<T>()` (Promise wrapper for TanStack Query).
- **Zustand** — used only for pure UI state (sidebar collapsed, selected service ID).
- **CSS Modules + CSS custom properties** — no Tailwind. Design tokens live in `index.css` (`--color-*`, `--space-*`, `--radius-*`, `--transition-*`).
- **Barrel exports** — each feature exports its public API through `index.ts`.

**Example: Effect-based HTTP client**

```typescript
// frontend/service-mesh/src/lib/http.ts
export const apiFetchEffect = <T>(
  path: string,
  init?: RequestInit,
): Effect.Effect<T, ApiError> =>
  Effect.tryPromise({
    try:   () => fetch(`${BASE}${path}`, init),
    catch: (e) => makeApiError(0, String(e), path),
  }).pipe(
    Effect.flatMap((res) =>
      res.ok
        ? Effect.tryPromise({
            try:   () => res.json() as Promise<T>,
            catch: (e) => makeApiError(res.status, String(e), path),
          })
        : Effect.fail(makeApiError(res.status, res.statusText, path)),
    ),
  );
```

---

## Bounded Contexts & Module Map

| Module | Purpose | Key Entry Points | Dependencies |
|---|---|---|---|
| `registry` (backend) | Service and instance lifecycle | `domain/model.ts`, `application/registry.service.ts`, `presentation/routes.ts` | None |
| `routing-rules` (backend) | Weighted routing and canary rule management | `domain/routing-rule.ts`, `application/routing-rule.service.ts`, `presentation/routes.ts` | `registry` (by `serviceId` reference) |
| `registry-ui` (frontend) | Dashboard overview and service stats | `features/registry/RegistryDashboard.tsx`, `features/registry/ServicesTable.tsx` | `services-ui` API |
| `services-ui` (frontend) | Service list and detail views | `features/services/ServicesPage.tsx`, `features/services/ServiceDetailPage.tsx` | `registry` API |
| `routing-rules-ui` (frontend) | Rule CRUD UI, weight visualization | `features/routing-rules/ui/RoutingRulesPage.tsx`, `features/routing-rules/domain/schema.ts` | `routing-rules` API |

---

## RAG Indexing Strategy

> **Critical:** Do NOT index the entire monorepo in one operation. Index by bounded context to prevent timeouts and preserve retrieval quality.

### Index by Bounded Context (Directory-Level)

- **Unit of indexing:** One bounded context directory at a time (e.g., `backend/service-mesh/src/modules/registry/`, `frontend/service-mesh/src/features/routing-rules/`).
- **Maximum batch size:** 50 files or 1000 chunks per indexing operation. If a bounded context exceeds this, split into sub-batches by layer (`domain/`, `application/`, `presentation/`).
- **Never index the entire monorepo in one operation.**

### Layered Indexing Priority (Within a Bounded Context)

When indexing a bounded context, follow this order:

| Priority | Layer | File Patterns | Rationale |
|---|---|---|---|
| 9 (critical) | Documentation | `README.md`, `AGENTS.md`, `.claude/*.md`, `docs/adr/*.md` | Agents need architectural context before reading code |
| 8 (high) | Domain | `*.domain.ts`, `*.types.ts`, `domain/*.ts` | Core business logic and invariants |
| 7 (high) | Application | `*.application.ts`, `*.dto.ts`, `application/*.ts` | Use cases and orchestration |
| 6 (medium) | Interface | `*.controller.ts`, `*.routes.ts`, `*.handlers.ts`, `*.middleware.ts` | HTTP handlers and API endpoints |
| 5 (medium) | Infrastructure | `*.infrastructure.ts`, `*.repository.ts`, `infrastructure/*.ts` | DB adapters and external APIs |
| 2 (low) | Tests | `*.test.ts`, `*.spec.ts`, `*.fixture.ts` | Verification and examples |

### Indexing Rules and Limits

| Rule | Limit | Action if exceeded |
|---|---|---|
| Function size | ≤ 40 lines | Refactor before indexing |
| File size | ≤ 300 lines | Split into multiple files |
| Entities per file | 1 aggregate root or major function | Extract into separate files |
| Generated code | Exclude | `*.gen.ts`, `routeTree.gen.ts` |
| Build artifacts | Exclude | `dist/`, `build/`, `coverage/`, `.next/`, `node_modules/` |
| Secrets | Exclude | `.env*`, `*.pem`, `secrets.*`, `docker-compose.override.yml` |
| IDE files | Exclude | `.idea/`, `.vscode/`, `.DS_Store` |
| Lockfiles | Exclude | `package-lock.json`, `go.sum` |

### Incremental and On-Demand Indexing

- **mtime-based incremental:** Only index files modified since the last indexing timestamp. Unchanged files are skipped.
- **Cache embeddings:** SHA-256 of chunk text → embedding vector. Identical chunks are never re-embedded.
- **On-demand indexing:** When an agent needs to work on a specific bounded context, index only that context.
- **Post-checkout indexing:** After `git checkout` or `git pull`, re-index only bounded contexts with changed files (detected via `git diff --name-only`).

### Chunking Strategy for RAG

| File Type | Chunk Boundary | Metadata Required |
|---|---|---|
| Code | Complete function, class, or interface declaration | `source`, `name`, `type`, `role`, `boundedContext`, `priority` |
| Documentation | Markdown headings (`##`, `###`) | `source`, `name` (heading text), `type: 'doc'`, `role: 'documentation'`, `priority: 9` |
| Configuration | Single file if < 3000 chars; otherwise by logical section | `source`, `name` (section), `type: 'config'`, `priority: 5` |

**Chunk metadata fields:**
- `source`: file path (relative to project root)
- `name`: function name, class name, or heading text
- `type`: `function` | `class` | `interface` | `doc` | `config` | `test`
- `role`: `domain` | `application` | `interface` | `infrastructure` | `documentation` | `test`
- `boundedContext`: directory name (e.g., `registry`, `routing-rules`)
- `priority`: `9` | `8` | `7` | `6` | `5` | `2`

---

## File Naming Conventions

Naming patterns enable automatic RAG role classification:

| Pattern | Role | Example |
|---|---|---|
| `*.domain.ts` | Domain logic (pure functions, entities, value objects) | `routing-rule.domain.ts` |
| `*.types.ts` | Domain types, interfaces, type aliases | `routing-rule.types.ts` |
| `*.application.ts` | Application services, use cases, orchestration | `registry.application.ts` |
| `*.dto.ts` | Data transfer objects, validation schemas (Zod, io-ts) | `service.dto.ts` |
| `*.infrastructure.ts` | Infrastructure adapters (DB, HTTP, external APIs) | `postgres.infrastructure.ts` |
| `*.repository.ts` | Data access implementations | `service.repository.ts` |
| `*.controller.ts` | Presentation layer (HTTP handlers, CLI) | `service.controller.ts` |
| `*.routes.ts` | Route definitions | `registry.routes.ts` |
| `*.handlers.ts` | Request handlers | `service.handlers.ts` |
| `*.contracts.ts` | API contracts (Zod schemas, EndpointContract) | `service.contracts.ts` |
| `*.test.ts` | Unit tests | `registry.service.test.ts` |
| `*.spec.ts` | Specification / contract tests | `api.spec.ts` |
| `*.fixture.ts` | Test data builders | `service.fixture.ts` |
| `README.md` | Module-level documentation | `backend/service-mesh/README.md` |
| `AGENTS.md` | Project-level architecture guide | `AGENTS.md` (this file) |

---

## Common Patterns

### Error Handling Pattern

Use `Result<T, E>` from neverthrow. Never throw exceptions for expected errors.

```typescript
import { ok, err, type Result } from 'neverthrow';

// Application service returns Result
deleteService(id: string): Result<void, RegistryError> {
  const sid = serviceId(id);
  if (!this.services.has(sid)) {
    return err(registryError('SERVICE_NOT_FOUND', `Service ${id} not found`));
  }
  this.services.delete(sid);
  return ok(undefined);
}

// Handler maps Result to HTTP status
const result = registryService.deleteService(id);
if (result.isErr()) {
  return reply.code(404).send({ error: result.error.code, message: result.error.message });
}
return reply.code(204).send();
```

See [Error Handling](#error-handling-pattern) and `backend/service-mesh/src/modules/registry/application/registry.service.ts`.

### Validation Pattern

**Parse, don't validate.** Decode at the boundary.

**Backend (Zod):**
```typescript
import { z } from 'zod';

const createServiceSchema = z.object({
  name: z.string().min(1),
  labels: z.record(z.string()).optional(),
});

const input = createServiceSchema.parse(request.body);
```

**Frontend (Effect Schema):**
```typescript
import { Schema } from 'effect';

const NonBlankString = Schema.String.pipe(
  Schema.filter(s => s.trim().length > 0 || 'must not be blank'),
);
```

See `frontend/service-mesh/src/features/routing-rules/domain/schema.ts`.

### Logging Pattern

Use Pino for structured logging. No `console.log` in domain or application layers.

```typescript
import { env } from '@/config/env.js';
import pino from 'pino';

const logger = pino({ level: env.LOG_LEVEL });

// Structured, context-aware
logger.info({ serviceId: id }, 'Service created');
```

### Testing Pattern

| Layer | Test Type | Runner | Location |
|---|---|---|---|
| Domain | Unit | Node.js built-in via `tsx` | Co-located: `domain/*.test.ts` |
| Application | Integration | Node.js built-in via `tsx` | Co-located: `application/*.test.ts` |
| Presentation | HTTP | Node.js built-in via `tsx` | Co-located: `presentation/*.http.test.ts` |
| Frontend | Component + Unit | Vitest + jsdom | Co-located: `*.test.tsx` |

**Minimum coverage target:** 80%.

See `backend/service-mesh/src/modules/routing-rules/application/routing-rule.service.test.ts` and `frontend/service-mesh/src/features/routing-rules/ui/RulesTable/RulesTable.test.tsx`.

### Documentation Pattern (JSDoc / TSDoc)

Every exported function must have a JSDoc comment. This is critical for RAG chunking and agent comprehension.

Required JSDoc fields:
- **What it does** — one sentence summary
- **Parameters** — types and meaning
- **Return value** — type and semantics
- **Side effects** — explicit if any (`none` if pure)
- **Domain invariants** — invariants maintained or enforced

```typescript
/**
 * Derives the composite health status of an instance from heartbeat TTL
 * and the last health check result. Returns the worst-case status.
 *
 * @param instance - The instance to evaluate
 * @param ttlMs - Time-to-live threshold in milliseconds
 * @returns InstanceStatus: 'passing', 'warning', or 'critical'
 * @sideEffects none
 * @invariants If elapsed >= ttlMs, status is always 'critical'
 */
export const deriveStatus = (
  instance: Instance,
  ttlMs: number,
): InstanceStatus => { /* ... */ };
```

---

## Anti-Patterns

**Never do the following in this codebase:**

| Anti-Pattern | Why | Correct Approach |
|---|---|---|
| Use `any` | Destroys type safety | Use `unknown` with Zod/Schema parsing |
| Mutate aggregate state outside domain functions | Violates DDD invariants | Return new objects via pure functions |
| Throw exceptions for expected errors | Breaks explicit error handling | Return `Result<T, E>` via neverthrow |
| Call infrastructure from domain layer | Violates layered architecture | Inject dependencies via function parameters |
| Use `console.log` in domain/application | Unstructured, untestable | Use Pino in presentation layer only |
| Use classes for business logic | FP prefers modules + functions | Use exported functions; classes only for stateful application services |
| Use loops (`for`/`while`) where `map`/`filter`/`reduce` suffice | Violates eslint-plugin-fp | Prefer array methods |
| Use Tailwind CSS | Project uses CSS Modules + custom properties | Write scoped styles in `*.module.css` |
| Index generated code | Pollutes RAG with irrelevant chunks | Exclude `*.gen.ts`, `routeTree.gen.ts` |
| Mutate shared Maps directly in handlers | Bypasses application layer logic | Call application service methods |

---

## Entry Points for Common Tasks

| Task | Where to Start | Key Files |
|---|---|---|
| Add a new domain entity | `backend/service-mesh/src/modules/[context]/domain/` | `model.ts`, `errors.ts` |
| Add a new use case | `backend/service-mesh/src/modules/[context]/application/` | `*.service.ts`, `*.service.impl.ts` |
| Add a new infrastructure adapter | `backend/service-mesh/src/modules/[context]/infrastructure/` | Repository interface + implementation |
| Add a new API endpoint | `backend/service-mesh/src/modules/[context]/presentation/` | `contracts/*.ts`, `handlers/*.ts`, `routes.ts` |
| Add a new bounded context | `backend/service-mesh/src/modules/[new-context]/` | Mirror `registry/` structure |
| Add a new React component | `frontend/service-mesh/src/features/[feature]/ui/` | `*.tsx` + `*.module.css` |
| Add a new frontend feature module | `frontend/service-mesh/src/features/[feature]/` | `domain/`, `application/`, `infrastructure/`, `ui/` |
| Add a new route | `frontend/service-mesh/src/routes/` | File-based TanStack Router |
| Run backend tests | `cd backend/service-mesh && npm test` | `tsx --test src/**/*.test.ts` |
| Run frontend tests | `cd frontend/service-mesh && npm test` | `vitest run` |
| Add a database migration | Out of MVP scope | Design repository interface first |

---

## Pull Request & Commit Guidelines

### Size Limit

**A single commit or pull request must not exceed 300 lines** (added + deleted).

**Why:**
- Keeps code review fast and thorough.
- Reduces the risk of shipping hidden bugs.
- Makes rollbacks and bisects easier.

**If a task exceeds 300 lines:** split it into smaller, logically independent commits or stacked PRs. Each chunk should compile and pass tests on its own.

---

## Environment Setup

### Prerequisites

- Node.js >= 20
- Docker + Docker Compose
- npm

### Backend (service-mesh)

```bash
cd backend/service-mesh
npm install
npm run dev        # http://localhost:4000
npm run typecheck  # tsc --noEmit
npm run test       # tsx --test src/**/*.test.ts
npm run lint       # eslint src
```

**Environment variables** (validated via Zod in `config/env.ts`):
- `NODE_ENV` — `development` | `production` | `test` (default: `development`)
- `PORT` — number (default: `4000`)
- `HOST` — string (default: `0.0.0.0`)
- `LOG_LEVEL` — `fatal` | `error` | `warn` | `info` | `debug` | `trace` (default: `info`)
- `INSTANCE_TTL_SECONDS` — number (default: `30`)

Invalid env vars cause `process.exit(1)` on startup.

### Mock Service

```bash
cd backend/mock-service
npm install
npm run dev        # http://localhost:3001
```

### Frontend

```bash
cd frontend/service-mesh
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # tsr generate && tsc --noEmit
npm run test       # vitest run
npm run lint       # tsr generate && eslint src
```

**Build-time env:** `VITE_API_URL` → passed via Docker `build.args`.

### Docker Compose (All Services)

```bash
# Full stand: registry + 2×mock-service + UI
docker compose -f docker-compose.service-mesh.yml up --build

# Monitoring stand (infra)
cd infra && docker compose up

# Backend + mock-service only
cd backend && docker compose up
```

**Ports:**
- Registry API: `http://localhost:4000`
- UI: `http://localhost:5173`
- Mock-1: `http://localhost:3001`
- Mock-2: `http://localhost:3002`

---

## Agent Configuration Files

Specialized configurations for Claude AI agents live in `.claude/`:

| File | Scope | Contents |
|---|---|---|
| `.claude/backend.md` | Backend agent | DDD, FP, neverthrow, Zod, EndpointContract patterns |
| `.claude/frontend.md` | Frontend agent | React 19, TanStack Router, local-first, CSS Modules |
| `.claude/infra.md` | Infra agent | Terraform, Helm, k3s, Prometheus/Grafana |
| `.claude/config.md` | All agents | Common style rules, testing requirements, model preferences |

When working on a specific layer, read the corresponding agent configuration file before making changes.
