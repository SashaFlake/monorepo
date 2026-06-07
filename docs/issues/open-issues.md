# Открытые GitHub Issues — SashaFlake/monorepo
Всего открытых: 11
---

## [Issue #57] [Backend] Missing Repository Pattern — application layer tightly coupled to in-memory Maps
- **State:** open | **Labels:** refactor, backend
- **Created:** 2026-06-07 | **URL:** https://github.com/SashaFlake/monorepo/issues/57

## Problem

Currently:
- `modules/registry/application/registry.service.ts` (lines 53-54) directly owns `Map<ServiceId, Service>` and `Map<InstanceId, Instance>`.
- `modules/routing-rules/application/routing-rule.service.impl.ts` directly owns `Map<string, RoutingRule>`.

There is **no repository interface** in the `application/` layer and **no infrastructure implementation**. This violates the DDD Repository Pattern requirement.

## Why it's critical

This blocks any future migration to PostgreSQL (or any other persistence) without rewriting application services. Per AGENTS.md: *"Future: PostgreSQL persistence is out of MVP scope but must fit the existing repository interface without changing domain or application layers."*

## Expected

1. Define repository interfaces in `application/`:
   - `ServiceRepository`
   - `InstanceRepository`
   - `RoutingRuleRepository`
2. Move `Map`-based implementations to `infrastructure/` (e.g. `infrastructure/in-memory.service.repository.ts`).
3. Inject repositories into application services via constructor.

## References

- AGENTS.md: "Repository Pattern and Infrastructure Boundaries"
- `modules/registry/application/registry.service.ts`
- `modules/routing-rules/application/routing-rule.service.impl.ts`
---

## [Issue #58] [Backend] z.any() in API contracts destroys type safety
- **State:** open | **Labels:** bug, backend
- **Created:** 2026-06-07 | **URL:** https://github.com/SashaFlake/monorepo/issues/58

## Problem

`z.any()` is used in multiple API contract schemas, completely bypassing runtime validation:

- `backend/service-mesh/src/modules/registry/presentation/contracts/service.contracts.ts:32`
  - `ServiceSchemas.ServiceDto` contains `instances: z.array(z.any())`
- `backend/service-mesh/src/modules/registry/presentation/contracts/service.contracts.ts:38`
  - `ServiceSchemas.VersionsDto` contains `versions: z.array(z.any())`
- `backend/service-mesh/src/modules/registry/presentation/contracts/service.contracts.ts:102`
  - `GetServiceOpenApiContract.response: z.any()`

Additionally, unsafe type assertions exist in:
- `registry/presentation/handlers/service.handlers.ts`: `req.query as Record<string, string>`
- `mock-service/src/index.ts`: `await res.json() as ServiceView[]`, `as ServiceView`, `as InstanceView`

## Why it's critical

`z.any()` destroys type safety at the most important system boundary — the HTTP API. TypeScript cannot catch errors, and malformed data can propagate into domain logic causing runtime failures. This is a direct violation of AGENTS.md: *"Anti-Pattern: Use `any`. Destroys type safety. Correct Approach: Use `unknown` with Zod/Schema parsing."*

## Expected

1. Replace `z.array(z.any())` with properly typed schemas (e.g. `z.array(InstanceViewSchema)`).
2. Replace `z.any()` response with a concrete OpenAPI schema.
3. Remove unsafe `as` assertions — parse at the boundary with Zod/Schema.

## References

- AGENTS.md: "Validation Pattern — Parse, don't validate. Decode at the boundary."
- `backend/service-mesh/src/modules/registry/presentation/contracts/service.contracts.ts`
---

## [Issue #59] [Backend] Missing branded types in routing-rules + list methods don't return Result
- **State:** open | **Labels:** refactor, backend
- **Created:** 2026-06-07 | **URL:** https://github.com/SashaFlake/monorepo/issues/59

## Problem

### Missing branded types

In `routing-rules` domain, IDs are plain `string` instead of branded types:

- `RoutingRule.id: string` (should be `RoutingRuleId`)
- `RoutingRule.serviceId: string` (should be `ServiceId`)

File: `backend/service-mesh/src/modules/routing-rules/domain/routing-rule.ts:16-17`

In contrast, `registry` module correctly uses `ServiceId` and `InstanceId` with constructors `serviceId()` / `instanceId()`.

### list methods don't return Result

Two application service methods bypass the `Result<T, E>` pattern:

- `RegistryService.listServices()` returns `ServiceView[]` instead of `Result<ServiceView[], RegistryError>`
  - File: `backend/service-mesh/src/modules/registry/application/registry.service.ts:109`
- `RoutingRuleService.list()` returns `RoutingRule[]` instead of `Result<RoutingRule[], RoutingRuleError>`
  - File: `backend/service-mesh/src/modules/routing-rules/application/routing-rule.service.ts:11`

## Why it's critical

Branded types are the **foundation of type-safe DDD** in this project. Without them, a `ruleId` can be accidentally passed where a `serviceId` is expected, and the compiler won't catch it.

`listServices()` / `list()` breaking the `Result` convention creates an **unpredictable API surface** — all other use-case methods (`createService`, `getService`, `deleteService`, `create`, `update`) return `Result`, but `list*` methods don't. Consumers must handle two different error-handling patterns.

## Expected

1. Introduce branded types in `routing-rules` domain:
   - `type RoutingRuleId = string & { readonly _brand: 'RoutingRuleId' }`
   - `const routingRuleId = (id: string): RoutingRuleId => id as RoutingRuleId`
2. Update `listServices()` signature to `Result<ServiceView[], RegistryError>`
3. Update `list()` signature to `Result<RoutingRule[], RoutingRuleError>`

## References

- AGENTS.md: "Branded types for IDs"
- AGENTS.md: "neverthrow — Application services returns Result<T, ErrorType>"
---

## [Issue #60] [Backend] Complete absence of tests in registry module
- **State:** open | **Labels:** backend, testing
- **Created:** 2026-06-07 | **URL:** https://github.com/SashaFlake/monorepo/issues/60

## Problem

The `registry` module has **zero tests**. No co-located tests exist for any layer:

- No `domain/*.test.ts`
- No `application/*.test.ts`
- No `presentation/*.http.test.ts`

In contrast, the `routing-rules` module already has:
- `routing-rule.service.test.ts`
- `routing-rule.http.test.ts`

## Why it's critical

`registry` is the **core module** of the entire system — it handles service discovery, heartbeat, health checks, and instance lifecycle. Without tests, any refactoring, bug fix, or feature addition risks silently breaking critical functionality.

AGENTS.md requires a **minimum coverage target of 80%** and co-located tests for all layers.

## Expected

Add co-located tests for all layers:

1. **Domain tests**: `modules/registry/domain/model.test.ts`
   - `deriveStatus()` — passing/warning/critical thresholds
   - `worstStatus()` — aggregation logic
   - `toServiceView()` / `toInstanceView()` — mapping correctness

2. **Application tests**: `modules/registry/application/registry.service.test.ts`
   - `createService` — upsert by name+labels, duplicate prevention
   - `registerInstance` — instance creation, missing service error
   - `heartbeat` — TTL updates, missing instance error
   - `deleteService` — cascade deletion of instances
   - `listServices` — filtering by name and labels
   - `recordHealthCheck` — health result storage

3. **Presentation tests**: `modules/registry/presentation/registry.http.test.ts`
   - HTTP round-trips for all endpoints with Fastify inject()

## References

- AGENTS.md: "Testing Pattern — Minimum coverage target: 80%"
- `backend/service-mesh/src/modules/routing-rules/application/routing-rule.service.test.ts` (existing example)
---

## [Issue #61] [Backend] Mutable domain types in routing-rules + recordHealthCheck silently swallows errors
- **State:** open | **Labels:** bug, backend
- **Created:** 2026-06-07 | **URL:** https://github.com/SashaFlake/monorepo/issues/61

## Problem

### Mutable domain types in routing-rules

All value objects in `routing-rules` domain are mutable `interface` without `readonly`:

- `RoutingRuleMatch` — `headers?: Record<string, string>`, `pathPrefix?: string`
- `RoutingRuleDestination` — `version?: string`, `weightPct: number`
- `RoutingRule` — all fields mutable

File: `backend/service-mesh/src/modules/routing-rules/domain/routing-rule.ts:5-24`

### recordHealthCheck silently swallows "instance not found"

`RegistryService.recordHealthCheck()` returns `void` and does nothing when the instance doesn't exist:

```typescript
recordHealthCheck(id: string, result: Omit<HealthCheckResult, 'checkedAt'>): void {
  const iid = instanceId(id)
  const instance = this.instances.get(iid)
  if (instance) {                       // ← missing else branch — error swallowed
    this.instances.set(iid, {
      ...instance,
      lastHealthCheck: { ...result, checkedAt: new Date() },
    })
  }
}
```

File: `backend/service-mesh/src/modules/registry/application/registry.service.ts:169-181`

## Why it's critical

Immutable value objects are a **fundamental FP+DDD principle** in this project. Mutable domain types allow accidental in-place modifications that violate aggregate consistency.

The silent health-check failure is a **hidden bug** — if an instance is deregistered but health-checker still tries to record a result, the operation appears to succeed while doing nothing. This can leave routing decisions based on stale health data, sending traffic to dead instances.

## Expected

1. Add `readonly` to all fields in `routing-rules` domain types.
2. Change `recordHealthCheck` return type to `Result<void, RegistryError>`:
   ```typescript
   recordHealthCheck(id: string, result: ...): Result<void, RegistryError> {
     const iid = instanceId(id)
     const instance = this.instances.get(iid)
     if (!instance) {
       return err(registryError('INSTANCE_NOT_FOUND', `Instance ${id} not found`))
     }
     this.instances.set(iid, {
       ...instance,
       lastHealthCheck: { ...result, checkedAt: new Date() },
     })
     return ok(undefined)
   }
   ```

## References

- AGENTS.md: "All value objects are immutable."
- AGENTS.md: "neverthrow — No exceptions for expected errors. Return Result<T, E>."
---

## [Issue #62] [Frontend] Missing DDD layers in registry and services features
- **State:** open | **Labels:** refactor, frontend
- **Created:** 2026-06-07 | **URL:** https://github.com/SashaFlake/monorepo/issues/62

## Problem

Two major features (`registry` and `services`) do not follow the required DDD layer structure (`domain/`, `application/`, `infrastructure/`, `ui/`).

- `features/registry/` contains components and a hook flat in the feature root:
  - `RegistryDashboard.tsx`, `ServicesTable.tsx`, `StatsGrid.tsx`, `useRegistryStats.ts`
  - No `domain/`, `application/`, `infrastructure/`, `ui/` directories.
- `features/services/` uses non-standard `api/` and `components/` instead of DDD layers:
  - `api/api.ts`, `api/types.ts`
  - `components/InstancesPanel.tsx`, `components/OpenApiPanel.tsx`, `components/VersionCard.tsx`, etc.

In contrast, `routing-rules` correctly follows the layer structure.

## Why it's critical

This breaks the fundamental frontend architecture defined in AGENTS.md. Without clear layer boundaries:
- Domain logic leaks into UI components.
- API clients are imported directly by presentational components.
- Testing becomes impossible without mocking the entire stack.
- Refactoring requires touching every file in the feature.

## Expected

Restructure both features to match `routing-rules` layout:

```
features/registry/
  domain/
    types.ts
  application/
    useRegistryStats.application.ts
  infrastructure/
    registry.infrastructure.ts
  ui/
    RegistryDashboard/
      RegistryDashboard.tsx
      RegistryDashboard.module.css
      RegistryDashboard.test.tsx
    ServicesTable/
      ...
    StatsGrid/
      ...
  index.ts

features/services/
  domain/
    types.ts
  application/
    useServices.application.ts
    useServiceDetail.application.ts
  infrastructure/
    services.infrastructure.ts
  ui/
    ServicesPage/
      ServicesPage.tsx
      ServicesPage.module.css
      ServicesPage.test.tsx
    ServiceDetailPage/
      ...
  index.ts
```

## References

- AGENTS.md: "Frontend — DDD-Inspired + Local-First"
- `features/routing-rules/` (existing correct example)
---

## [Issue #63] [Frontend] useQuery called directly in UI components instead of application hooks
- **State:** open | **Labels:** refactor, frontend
- **Created:** 2026-06-07 | **URL:** https://github.com/SashaFlake/monorepo/issues/63

## Problem

Server-state hooks (`useQuery`) are called directly inside React UI components instead of being encapsulated in the `application/` layer.

**Files:**
- `features/services/ServicesPage.tsx:12-17` — calls `useQuery({ queryKey: registryKeys.list(), queryFn: registryApi.listServices })`
- `features/services/ServiceDetailPage.tsx:213-218` — calls `useQuery({ queryKey: registryKeys.versions(serviceId), queryFn: () => registryApi.getServiceVersions(serviceId) })`
- `features/services/components/OpenApiPanel.tsx:76-81` — a presentational component calls `useQuery` directly
- `features/registry/useRegistryStats.ts:41-46` — a server-state hook lives in the feature root instead of `application/`

## Why it's critical

AGENTS.md mandates that the `application/` layer owns all server-state hooks (TanStack Query). When UI components call `useQuery` directly:
- Query keys and API clients leak into the presentation layer.
- Components become tightly coupled to data fetching.
- Reuse and testing are severely hampered — you cannot render a component without a QueryClient provider and a backend.
- The boundary between "what to show" (UI) and "how to get data" (application) is erased.

## Expected

1. Move all `useQuery` / `useMutation` calls into `application/` hooks:
   - `features/services/application/useServices.application.ts`
   - `features/services/application/useServiceDetail.application.ts`
   - `features/services/application/useServiceOpenApi.application.ts`
   - `features/registry/application/useRegistryStats.application.ts`
2. UI components should receive data and callbacks exclusively via props.
3. Application hooks should encapsulate query keys, retry logic, refetch intervals, and error handling.

## References

- AGENTS.md: "Application layer — Hooks, use cases, state management (TanStack Query hooks)"
- AGENTS.md: "Presentation layer should not know about query keys or API clients."
---

## [Issue #64] [Frontend] Type safety violations: any, unsafe assertions, inline styles
- **State:** open | **Labels:** bug, frontend
- **Created:** 2026-06-07 | **URL:** https://github.com/SashaFlake/monorepo/issues/64

## Problem

Multiple type-safety violations exist across the frontend codebase:

### `any` in DataTable
- `shared/table/DataTable.tsx:12-13`
  - `// eslint-disable-next-line @typescript-eslint/no-explicit-any`
  - `columns: ColumnDef<TData, any>[]`

### Unsafe `as` assertions
- `lib/http.ts:62` — `res.json() as Promise<T>` force-casts the entire response body.
- `features/services/ServiceDetailPage.tsx:92` — `const doc = data as OpenApiDoc`
- `features/services/ServiceDetailPage.tsx:98` — `const operation = op as OpenApiOperation`

### Inline styles instead of CSS Modules
- `features/services/ServicesPage.tsx:28,57` — `style={{ padding: 0, overflow: 'hidden' }}`
- `features/services/ServiceDetailPage.tsx:122,124,181` — inline `style={{ opacity: ... }}`, `style={{ color: ... }}`
- `features/registry/StatsGrid.tsx` — `style={{ color: 'var(--color-text-faint)' }}`
- `features/routing-rules/ui/RulesTable/RulesTable.tsx:84` — inline styles for empty state
- `shared/table/DataTable.tsx:54` — `style={onRowClick ? { cursor: 'pointer' } : undefined}`

## Why it's critical

- `any` and `as` destroy TypeScript's strict mode. Runtime errors that the compiler should catch will instead crash in production.
- Inline styles bypass the project's design system (CSS Modules + CSS custom properties). They are harder to maintain, impossible to theme consistently, and violate AGENTS.md's explicit "no Tailwind, use CSS Modules" rule.
- `lib/http.ts` is the universal HTTP client — an unsafe cast there undermines type safety for **every API call in the frontend**.

## Expected

1. Replace `ColumnDef<TData, any>` with a properly typed generic or constrained unknown.
2. In `lib/http.ts`, replace `as Promise<T>` with Effect Schema decoding (`Schema.decodeUnknown`).
3. In `ServiceDetailPage`, replace all `as` assertions with `Schema.decodeUnknownSync(OpenApiDocSchema)` (the schema already exists in `components/OpenApiPanel.tsx`).
4. Extract all inline styles into CSS Module classes (`.cardNoPadding`, `.deprecatedRow`, `.methodBadgeGet`, etc.).

## References

- AGENTS.md: "Anti-Pattern: Use `any`. Destroys type safety."
- AGENTS.md: "Parse, don't validate. Decode at the boundary."
- AGENTS.md: "CSS Modules + CSS custom properties — no Tailwind."
---

## [Issue #65] [Frontend] Complete absence of tests in registry, services, shared modules
- **State:** open | **Labels:** frontend, testing
- **Created:** 2026-06-07 | **URL:** https://github.com/SashaFlake/monorepo/issues/65

## Problem

Two of the three main features (`registry`, `services`) have **zero test coverage**. Additionally, `shared/`, `routes/`, `components/layout/`, and `lib/http.ts` are completely untested.

**Untested areas:**
- `features/registry/` — no tests at all
- `features/services/` — no tests at all
- `shared/table/DataTable.tsx` — no tests
- `shared/ui/` (design-system primitives: Button, Card, Dialog, Badge, etc.) — no tests
- `routes/` (file-based TanStack Router pages) — no tests
- `components/layout/` (Header, Sidebar) — no tests
- `lib/http.ts` — no tests

The only existing tests are in `routing-rules`:
- `DestinationList.test.tsx`
- `RulesTable.test.tsx`
- `WeightBar.test.tsx`
- `schema.test.ts`

And one in `shared/form/schemaResolver.test.ts`.

## Why it's critical

`registry` and `services` are the **core user-facing features** of the admin UI. Without tests:
- Any refactoring (e.g. fixing the DDD layer violations in issue #1) risks silent regressions.
- Design-system primitives (Button, Dialog, etc.) can break accessibility or behavior without detection.
- The HTTP client (`lib/http.ts`) — the most critical infrastructure piece — has no verification for error handling, retries, or parsing.

AGENTS.md requires a **minimum coverage target of 80%** and co-located tests for all layers.

## Expected

Add co-located tests for all layers:

1. **Domain tests**
   - `features/registry/domain/*.test.ts`
   - `features/services/domain/*.test.ts`

2. **Application tests**
   - `features/registry/application/useRegistryStats.test.ts`
   - `features/services/application/useServices.test.ts`
   - `features/services/application/useServiceDetail.test.ts`

3. **UI component tests**
   - `features/registry/ui/RegistryDashboard/RegistryDashboard.test.tsx`
   - `features/services/ui/ServicesPage/ServicesPage.test.tsx`
   - `shared/ui/Button/Button.test.tsx`
   - `shared/ui/Dialog/Dialog.test.tsx`
   - `shared/table/DataTable.test.tsx`

4. **Infrastructure tests**
   - `lib/http.test.ts`

5. **Route tests**
   - `routes/__root.test.tsx`
   - `routes/services.index.test.tsx`

## References

- AGENTS.md: "Frontend testing: Vitest + jsdom + React Testing Library. Minimum coverage target: 80%."
- `features/routing-rules/ui/RulesTable/RulesTable.test.tsx` (existing example)
---

## [Issue #66] [Frontend] ServiceDetailPage is a 258-line monolith with duplicate components
- **State:** open | **Labels:** refactor, frontend
- **Created:** 2026-06-07 | **URL:** https://github.com/SashaFlake/monorepo/issues/66

## Problem

`ServiceDetailPage.tsx` is a **258-line monolith** that violates single-responsibility on multiple levels.

### Multiple components in one file
The file defines **8 components/types**:
- `ManifestPanel`
- `SpecCard`
- `KV`
- `OpenApiPanel`
- `InstancesPanel`
- `VersionCard`
- `ServiceDetailPage`
- Helper types: `OpenApiOperation`, `OpenApiRoute`

### Duplicate components
- `OpenApiPanel` is defined inline (line 75) **AND** exists as a separate file `components/OpenApiPanel.tsx`.
- `VersionCard` is defined inline (line 179) **AND** exists as a separate file `components/VersionCard.tsx`.

This means the standalone files are either dead code or the inline versions should have been removed.

## Why it's critical

AGENTS.md explicitly states: «Entities per file: 1 aggregate root or major function — Extract into separate files.» A 258-line file with 8 components is unmaintainable:
- Code review becomes a chore.
- Reusing `ManifestPanel` or `InstancesPanel` elsewhere is impossible without copy-paste.
- The duplicate `OpenApiPanel` / `VersionCard` definitions risk diverging over time — one will be updated, the other forgotten.

## Expected

1. Extract every sub-component into its own file under `features/services/ui/`:
   - `ui/ManifestPanel/ManifestPanel.tsx`
   - `ui/SpecCard/SpecCard.tsx`
   - `ui/KV/KV.tsx`
   - `ui/OpenApiPanel/OpenApiPanel.tsx` (use the existing standalone file, delete inline version)
   - `ui/InstancesPanel/InstancesPanel.tsx`
   - `ui/VersionCard/VersionCard.tsx` (use the existing standalone file, delete inline version)
   - `ui/ServiceDetailPage/ServiceDetailPage.tsx` (orchestrator, ~40 lines)

2. Move helper types (`OpenApiOperation`, `OpenApiRoute`) to `features/services/domain/types.ts`.

3. Delete inline duplicates in `ServiceDetailPage.tsx`.

## References

- AGENTS.md: "Entities per file: 1 aggregate root or major function — Extract into separate files."
- AGENTS.md: "File size limit: ≤ 300 lines — Split into multiple files."
---

## [PR #68] 62 frontend ddd restructure
- **State:** open
- **Created:** 2026-06-07 | **URL:** https://github.com/SashaFlake/monorepo/pull/68
---
