# Открытые GitHub Issues — SashaFlake/monorepo
Всего открытых: 5 (все backend)
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

## Small Iterations

> Do all iterations behind the existing application-service interface; no route/contract changes until Iteration D.

1. **Iteration A — registry interfaces**  
   Define `ServiceRepository` and `InstanceRepository` interfaces in `modules/registry/application/`. Keep `RegistryService` compiling by inlining the same `Map` logic temporarily.
2. **Iteration B — routing-rules interface**  
   Define `RoutingRuleRepository` in `modules/routing-rules/application/`.
3. **Iteration C — in-memory registry impl**  
   Move `Map<ServiceId, Service>` / `Map<InstanceId, Instance>` to `modules/registry/infrastructure/in-memory.service.repository.ts` and inject into `RegistryService`.
4. **Iteration D — in-memory routing-rules impl + handlers**  
   Move `Map<string, RoutingRule>` to `modules/routing-rules/infrastructure/in-memory.routing-rule.repository.ts`, inject into `RoutingRuleService`, update handlers if constructors change.

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

## Small Iterations

1. **Iteration A — registry contracts**  
   Replace `z.array(z.any())` / `z.any()` in `service.contracts.ts` with concrete schemas (`InstanceViewSchema`, `VersionViewSchema`, etc.). Update handlers to parse.
2. **Iteration B — handler query parsing**  
   Remove `req.query as Record<string, string>` in `service.handlers.ts`; parse with Zod.
3. **Iteration C — mock-service safety**  
   Replace `as ServiceView[]` / `as ServiceView` / `as InstanceView` in `mock-service/src/index.ts` with Zod parsing using exported contract schemas.

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

## Small Iterations

1. **Iteration A — branded RoutingRuleId**  
   Add `RoutingRuleId` + `routingRuleId()` in `routing-rules/domain/`, update `RoutingRule.id`, then propagate through service and handlers.
2. **Iteration B — use ServiceId in routing-rules**  
   Import `ServiceId` / `serviceId()` from `registry/domain` (shared kernel) and replace `string` for `RoutingRule.serviceId`.
3. **Iteration C — Result for listServices**  
   Change `RegistryService.listServices()` return type to `Result<ServiceView[], RegistryError>` and update callers.
4. **Iteration D — Result for list routing-rules**  
   Change `RoutingRuleService.list()` return type to `Result<RoutingRule[], RoutingRuleError>` and update callers.

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

## Small Iterations

1. **Iteration A — domain tests**  
   `modules/registry/domain/model.test.ts`: `deriveStatus`, `worstStatus`, view mappers.
2. **Iteration B — application service tests (part 1)**  
   `modules/registry/application/registry.service.test.ts`: `createService`, `registerInstance`, `heartbeat`, `deleteService`.
3. **Iteration C — application service tests (part 2)**  
   Same file: `listServices` filtering, `recordHealthCheck`.
4. **Iteration D — HTTP tests**  
   `modules/registry/presentation/registry.http.test.ts`: full endpoint round-trips with Fastify `inject()`.

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

## Small Iterations

1. **Iteration A — readonly routing-rules domain**  
   Add `readonly` to every field in `RoutingRuleMatch`, `RoutingRuleDestination`, `RoutingRule` in `routing-rules/domain/routing-rule.ts`. Fix any compile errors in service/presentation.
2. **Iteration B — recordHealthCheck returns Result**  
   Change `RegistryService.recordHealthCheck()` signature to `Result<void, RegistryError>`, return `INSTANCE_NOT_FOUND` error when instance missing, and update the health-checker caller to handle `Result`.

---

## [Issue #62] [Frontend] Missing DDD layers in registry and services features
- **State:** done | **Labels:** refactor, frontend
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
- **State:** done | **Labels:** refactor, frontend
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
- **State:** done | **Labels:** bug, frontend
- **Created:** 2026-06-07 | **URL:** https://github.com/SashaFlake/monorepo/issues/64
- **Closed note:** Verified 2026-06-08. All specific violations listed in this issue are fixed in `main`.

## Problem (historical)

Multiple type-safety violations existed across the frontend codebase:

- `any` in `DataTable` (`ColumnDef<TData, any>`)
- Unsafe `as` assertions in `lib/http.ts` and `ServiceDetailPage`
- Inline styles bypassing CSS Modules in several components

## Verification

| Violation | Status |
|---|---|
| `ColumnDef<TData, any>` | ✅ Fixed — now `ColumnDef<TData>[]` |
| `res.json() as Promise<T>` in `lib/http.ts` | ✅ Fixed — uses `Schema.decodeUnknown(schema)` |
| `as OpenApiDoc` / `as OpenApiOperation` | ✅ Fixed — uses `Schema.decodeUnknownSync` / `Schema.is` |
| Inline styles in listed components | ✅ Removed |

## References

- AGENTS.md: "Anti-Pattern: Use `any`. Destroys type safety."
- AGENTS.md: "Parse, don't validate. Decode at the boundary."
- AGENTS.md: "CSS Modules + CSS custom properties — no Tailwind."
---

## [Issue #65] [Frontend] Add missing tests — registry, services, shared
- **State:** done | **Labels:** frontend, testing
- **Created:** 2026-06-07 | **URL:** https://github.com/SashaFlake/monorepo/issues/65

## Problem

`registry`, `services`, `shared/ui/`, `routes/` and `lib/http.ts` lack co-located tests. AGENTS.md requires **minimum 80% coverage**. The issue is too big for one PR; it blocks any further refactoring of these core areas.

## Small Iterations

> Each iteration is an independent PR. Re-use existing `routing-rules` tests as templates.

### Iteration 1 — registry tests
- `features/registry/domain/types.test.ts` (pure domain types / helpers)
- `features/registry/application/useRegistryStats.test.ts`
- `features/registry/ui/RegistryDashboard/RegistryDashboard.test.tsx`
- `features/registry/ui/StatsGrid/StatsGrid.test.tsx` (already exists; ensure coverage)

**Acceptance:** `npm test` passes; `registry/` coverage ≥ 80%.

### Iteration 2 — services domain + application tests
- `features/services/domain/schema.test.ts` / `types.test.ts`
- `features/services/application/useServices.test.ts`
- `features/services/application/useServiceDetail.test.ts`

**Acceptance:** `services/application/` and `services/domain/` covered.

### Iteration 3 — services UI tests
- `features/services/ui/ServicesPage/ServicesPage.test.tsx` (already exists; extend if needed)
- `features/services/ui/ServiceDetailPage/ServiceDetailPage.test.tsx`
- `features/services/ui/ServiceDetailPage/OpenApiPanel.test.tsx` (already exists)
- `features/services/ui/ServiceDetailPage/InstancesPanel.test.tsx` (already exists)
- `features/services/ui/ServiceDetailPage/VersionCard.test.tsx` (already exists)

**Acceptance:** `services/ui/` coverage ≥ 80%.

### Iteration 4 — shared primitives + layout
- `shared/ui/Button/Button.test.tsx`
- `shared/ui/Dialog/Dialog.test.tsx`
- `shared/table/DataTable.test.tsx` (already exists; extend if needed)
- `components/layout/Header/Header.test.tsx`
- `components/layout/Sidebar/Sidebar.test.tsx`

**Acceptance:** `shared/ui/` and `components/layout/` have baseline coverage.

### Iteration 5 — routes + HTTP
- `lib/http.test.ts` (already exists; extend if needed)
- `routes/__root.test.tsx`
- `routes/services.index.test.tsx`

**Acceptance:** Route smoke tests render without crashing; `http.test.ts` covers error branches.

## Already Done

- `features/routing-rules/ui/RulesTable/RulesTable.test.tsx` and related routing-rules tests exist.
- `shared/form/schemaResolver.test.ts` exists.
- Some `services` sub-component tests already appeared during earlier refactoring.

## References

- AGENTS.md: "Frontend testing: Vitest + jsdom + React Testing Library. Minimum coverage target: 80%."
- `features/routing-rules/ui/RulesTable/RulesTable.test.tsx` (existing example)
---

## [Issue #66] [Frontend] ServiceDetailPage monolith + duplicate components
- **State:** done | **Labels:** refactor, frontend
- **Created:** 2026-06-07 | **URL:** https://github.com/SashaFlake/monorepo/issues/66
- **Closed note:** Verified 2026-06-08. Critical monolith problem solved; remaining folder-structure polish is non-blocking and tracked below as follow-up.

## Problem (historical)

`ServiceDetailPage.tsx` was a **258-line monolith** with 8 components/types defined inline, including duplicate `OpenApiPanel` and `VersionCard` definitions.

## Verification

| Criterion | Status |
|---|---|
| File size (258 → 61 lines) | ✅ |
| Duplicate inline components removed | ✅ |
| Sub-components extracted to separate files | ✅ Extracted under `features/services/ui/ServiceDetailPage/` |
| `OpenApiOperation` / `OpenApiRoute` moved to `domain/types.ts` | ⚠️ Still local to `OpenApiPanel.tsx`; non-blocking |
| Exact DDD folder structure from original issue | ⚠️ Components live under `ServiceDetailPage/` instead of sibling feature folders |

## Follow-up (non-blocking)

If stricter DDD layout is desired, open a focused follow-up issue:
- Move `ManifestPanel`, `OpenApiPanel`, `InstancesPanel`, `VersionCard` to sibling folders under `features/services/ui/`.
- Split `SpecCard` + `KV` out of `SharedComponents.tsx` into `features/services/ui/SpecCard/` and `features/services/ui/KV/`.
- Move `OpenApiOperation` / `OpenApiRoute` types to `features/services/domain/types.ts`.

## References

- AGENTS.md: "Entities per file: 1 aggregate root or major function — Extract into separate files."
- AGENTS.md: "File size limit: ≤ 300 lines — Split into multiple files."
---

## [Issue #69] [Frontend] Remaining inline styles across multiple components
- **State:** done | **Labels:** refactor, frontend
- **Created:** 2026-06-07 | **URL:** https://github.com/SashaFlake/monorepo/issues/69

## Problem

Multiple components still use inline `style={{...}}` props instead of CSS Module classes, bypassing the design system:

- `components/layout/Sidebar.tsx:28` — `style={{ flexShrink: 0 }}` (×2)
- `shared/ui/Skeleton/Skeleton.tsx:14` — `style={{ width, height }}`
- `features/services/ui/ServiceDetailPage/VersionCard.tsx:12` — `style={{ padding: 0, overflow: 'hidden' }}`
- `features/services/ui/ServiceDetailPage/InstancesPanel.tsx:26` — inline color style
- `features/routing-rules/ui/WeightBar/WeightBar.tsx:31,41` — inline `width`/`background`
- `features/routing-rules/ui/RuleFormModal/RuleFormModal.tsx:53` — `style={{ border: 'none', padding: 0, margin: 0 }}`

## Why it's critical

Inline styles bypass CSS Modules + CSS custom properties — the project's explicit design system. They are harder to maintain, impossible to theme consistently, and violate AGENTS.md.

## Expected

1. Extract every inline style to a CSS Module class.
2. For dynamic values (e.g. `width: ${pct}%`, `background: ${color}`), use CSS custom properties or data attributes.
3. Add co-located tests where missing.

## References

- AGENTS.md: "CSS Modules + CSS custom properties — no Tailwind."
- AGENTS.md: "Inline styles bypass the project's design system."

---

## [PR #68] 62 frontend ddd restructure
- **State:** closed
- **Created:** 2026-06-07 | **URL:** https://github.com/SashaFlake/monorepo/pull/68
---
