# Backend Audit — Non-Compliance with AGENTS.md Requirements

> Audit date: 2026-06-08 (updated)
> Scope: `backend/service-mesh/`, `backend/mock-service/`
> Criteria: AGENTS.md (DDD, FP, neverthrow, Zod, naming conventions, JSDoc, tests, etc.)

---

## 🔴 Critical Non-Compliance Issues

### 1. Missing Branded Types in `routing-rules`

**Where:** `backend/service-mesh/src/modules/routing-rules/domain/routing-rule.ts`

**Problem:** `RoutingRule.id` and `RoutingRule.serviceId` are plain `string`, **not branded types**. No constructors `ruleId()` / `routingRuleId()` exist.

**AGENTS.md requirement:** «Branded types for IDs: `type ServiceId = string & { readonly _brand: 'ServiceId' }`. Branded type constructors (`serviceId()`, `instanceId()`) prevent raw strings from leaking into domain logic.»

**Tracking:** Issue #59

---

### 2. Use of `z.any()` in Zod Contracts

**Where:** `backend/service-mesh/src/modules/registry/presentation/contracts/service.contracts.ts`

**Problem:**
- `ServiceSchemas.ServiceDto` contains `instances: z.array(z.any())`
- `ServiceSchemas.VersionsDto` contains `versions: z.array(z.any())`
- `GetServiceOpenApiContract.response: z.any()`

**AGENTS.md requirement:** «Anti-Pattern: Use `any`. Destroys type safety. Correct Approach: Use `unknown` with Zod/Schema parsing.»

**Tracking:** Issue #58

---

### 3. Complete Absence of Tests in the `registry` Module

**Where:** `backend/service-mesh/src/modules/registry/`

**Problem:** No tests at all. Missing:
- `domain/*.test.ts`
- `application/*.test.ts`
- `presentation/*.http.test.ts`

**AGENTS.md requirement:** «Minimum coverage target: 80%. Tests co-located.»

**Tracking:** Issue #60

---

### 4. Naming Convention Violations (Multiple Files)

| Current Path | Should Be |
|---|---|
| `modules/registry/domain/model.ts` | `modules/registry/domain/registry.domain.ts` or `registry.types.ts` |
| `modules/registry/domain/errors.ts` | `modules/registry/domain/registry-errors.domain.ts` or `registry-errors.types.ts` |
| `modules/registry/application/registry.service.ts` | `modules/registry/application/registry.application.ts` |
| `modules/registry/application/health-checker.ts` | `modules/registry/application/health-checker.application.ts` |
| `modules/registry/presentation/routes.ts` | `modules/registry/presentation/registry.routes.ts` |
| `modules/routing-rules/domain/routing-rule.ts` | `modules/routing-rules/domain/routing-rule.domain.ts` |
| `modules/routing-rules/domain/errors.ts` | `modules/routing-rules/domain/routing-rule-errors.domain.ts` |
| `modules/routing-rules/application/routing-rule.service.ts` | `modules/routing-rules/application/routing-rule.application.ts` |
| `modules/routing-rules/application/routing-rule.service.impl.ts` | `modules/routing-rules/application/routing-rule.application.ts` (or `routing-rule.infrastructure.ts` if it is a repository) |
| `modules/routing-rules/presentation/routes.ts` | `modules/routing-rules/presentation/routing-rules.routes.ts` |

**AGENTS.md requirement:** «File Naming Conventions — `*.domain.ts`, `*.types.ts`, `*.application.ts`, `*.dto.ts`, `*.routes.ts`, `*.handlers.ts`, `*.contracts.ts`, etc.»

---

### 5. Missing JSDoc / TSDoc on Exported Functions

**Where:** Multiple files

**Problem:** Critical non-compliance. Many exports lack JSDoc.

| File | Exports Without JSDoc |
|---|---|
| `modules/registry/domain/model.ts` | `deriveStatus`, `toInstanceView`, `worstStatus`, `toServiceView` |
| `modules/registry/domain/errors.ts` | `registryError` |
| `modules/registry/application/registry.service.ts` | `deleteService`, `getService`, `listServices`, `registerInstance`, `heartbeat`, `deregisterInstance`, `recordHealthCheck` |
| `modules/registry/application/health-checker.ts` | `ActiveHealthChecker` (class), `start`, `stop` |
| `modules/registry/presentation/routes.ts` | `registryRoutes` |
| `modules/registry/presentation/handlers/instance.handlers.ts` | `makeInstanceHandlers` |
| `modules/routing-rules/domain/errors.ts` | `routingRuleError` |
| `modules/routing-rules/application/routing-rule.service.ts` | methods of the `RoutingRuleService` interface |
| `modules/routing-rules/presentation/routes.ts` | `routingRulesRoutes` |
| `modules/routing-rules/presentation/handlers/routing-rule.handlers.ts` | `list`, `create`, `update`, `delete` (inside `makeRoutingRuleHandlers`) |

**AGENTS.md requirement:** «Every exported function must have a JSDoc comment. Required fields: What it does, Parameters, Return value, Side effects, Domain invariants.»

---

### 6. Missing Repository Pattern

**Where:**
- `backend/service-mesh/src/modules/registry/application/registry.service.ts`
- `backend/service-mesh/src/modules/routing-rules/application/routing-rule.service.impl.ts`

**Problem:** Application services directly own `Map<...>` (in-memory store). **No separate repository interface** in `application/` and no implementation in `infrastructure/`.

**AGENTS.md requirement:** «Repository Pattern and Infrastructure Boundaries — The application layer owns the storage contract. Infrastructure implements it. Future: PostgreSQL persistence is out of MVP scope but must fit the existing repository interface without changing domain or application layers.»

**Tracking:** Issue #57

---

### 7. Application Service Methods Return Non-Result Types

**Where:**
- `backend/service-mesh/src/modules/registry/application/registry.service.ts` — `listServices()` returns `ServiceView[]` (not `Result`)
- `backend/service-mesh/src/modules/routing-rules/application/routing-rule.service.ts` — `list(serviceId: string): RoutingRule[]` (not `Result`)

**AGENTS.md requirement:** «Application services return `Result<T, ErrorType>`. All use-case methods should return `Result`.»

**Tracking:** Issue #59

---

### 8. Unsafe Type Assertions Instead of Zod Parsing

**Where:**
- `backend/service-mesh/src/modules/registry/presentation/handlers/service.handlers.ts`
  - `const version = (req.query as Record<string, string>)['version']`
- `backend/mock-service/src/index.ts`
  - `await res.json() as ServiceView[]`
  - `as ServiceView`
  - `as InstanceView`

**AGENTS.md requirement:** «Parse, don't validate. Decode at the boundary. Anti-Pattern: Use `any`.»

**Tracking:** Issue #58

---

## 🟡 Medium Non-Compliance Issues

### 9. `console.error` in `config/env.ts`

**Where:** `backend/service-mesh/src/config/env.ts`

**Problem:** `console.error('Invalid environment variables:', ...)` on invalid env. Tolerable for the `config/` layer, but `AGENTS.md` mandates Pino everywhere.

**AGENTS.md requirement:** «Use Pino for structured logging. No `console.log` in domain or application layers.»

---

### 10. Mutable `interface` in `routing-rules` Domain

**Where:** `backend/service-mesh/src/modules/routing-rules/domain/routing-rule.ts`

**Problem:** Domain types are declared as `interface` with **mutable** fields (no `readonly`).

**AGENTS.md requirement:** «All value objects are immutable.»

**Tracking:** Issue #61

---

### 11. Use of `for...of` Instead of `map`/`filter`/`reduce`

**Where:** `backend/service-mesh/src/modules/registry/presentation/handlers/service.handlers.ts`

**Problem:**
- `parseLabelsQuery` uses `for...of`
- `groupByVersion` uses `for...of`

**AGENTS.md requirement:** «Anti-Pattern: Use loops (`for`/`while`) where `map`/`filter`/`reduce` suffice. Violates eslint-plugin-fp.»

---

### 12. Expected Errors Handled via `throw` in `mock-service`

**Where:** `backend/mock-service/src/index.ts`

**Problem:**
- `throw new Error('Create service failed...')`
- `throw new Error('Register instance failed...')`

Expected network/registration errors are handled via `throw` instead of `Result<T,E>`.

**AGENTS.md requirement:** «No exceptions for expected errors. Return `Result<T, E>` via neverthrow.»

---

### 13. Missing Zod Env Validation in `mock-service`

**Where:** `backend/mock-service/src/index.ts`

**Problem:** `process.env.*` is read directly without Zod (`Number(process.env.PORT ?? 3001)`). No separate `env.ts` file.

**AGENTS.md requirement:** «Environment variables validated via Zod in `config/env.ts`. Invalid env vars cause `process.exit(1)` on startup.»

---

### 14. `recordHealthCheck` Silently Swallows "instance not found"

**Where:** `backend/service-mesh/src/modules/registry/application/registry.service.ts`

**Problem:** `recordHealthCheck()` returns `void` and does nothing when the instance doesn't exist. Missing else branch — error swallowed.

**AGENTS.md requirement:** «No exceptions for expected errors. Return `Result<T, E>` via neverthrow.»

**Tracking:** Issue #61

---

## 🟢 Minor Non-Compliance Issues

### 15. Inconsistent Validation Approach in Registry Routes

**Where:** `backend/service-mesh/src/modules/registry/presentation/routes.ts`

**Problem:** In `routing-rules`, routes are registered with `{ schema: { ... } }` via `fastify-type-provider-zod`, pulling schemas from contracts. In `registry`, routes are registered **without** `schema`, and validation is done manually via `.safeParse()` inside handlers. `EndpointContract` is declared in `service.contracts.ts`, but Fastify is unaware of it.

**AGENTS.md requirement:** «EndpointContract — single source of truth for each endpoint.»

---

### 16. `try/catch` for Upstream Fetch in Handler

**Where:** `backend/service-mesh/src/modules/registry/presentation/handlers/service.handlers.ts` — `getOpenApi`

**Problem:** Uses `try/catch` for upstream fetch. Tolerable within a handler, but the error is handled via exception rather than `Result`.

**AGENTS.md requirement:** «No exceptions for expected errors.»

---

### 17. Retry Logic via `for` in `mock-service`

**Where:** `backend/mock-service/src/index.ts`

**Problem:** `for (let attempt = 1; attempt <= 10; attempt++)` — retry logic implemented with a loop.

**AGENTS.md requirement:** «Anti-Pattern: Use loops where `map`/`filter`/`reduce` suffice.»

---

## Summary Table

| Level | Count | Examples |
|---|---|---|
| 🔴 Critical | 8 | Missing branded types in routing-rules; `z.any()` in contracts; absence of tests in registry; naming convention violations; missing JSDoc; missing Repository pattern; non-Result return types; unsafe `as` assertions |
| 🟡 Medium | 6 | `console.error` in `env.ts`; `for...of` instead of reduce; `throw` in mock-service; mutable `interface` in routing-rules domain; no env validation in mock-service; `recordHealthCheck` swallows errors |
| 🟢 Minor | 3 | Inconsistent validation in registry routes; `try/catch` in handler; retry loop in mock-service |
