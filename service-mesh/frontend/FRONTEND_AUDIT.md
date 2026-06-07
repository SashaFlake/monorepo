# Frontend Audit — Non-Compliance with AGENTS.md Requirements

> Audit date: 2026-06-07
> Scope: `frontend/service-mesh/src/`
> Criteria: AGENTS.md (DDD layers, Effect, TanStack Query, CSS Modules, JSDoc, tests, etc.)

---

## 🔴 Critical Non-Compliance Issues

### 1. Missing DDD Layers in `registry` and `services` Features

**Where:**
- `frontend/service-mesh/src/features/registry/`
- `frontend/service-mesh/src/features/services/`

**Problem:** Neither feature follows the required DDD layer structure (`domain/`, `application/`, `infrastructure/`, `ui/`).

- `features/registry/` contains components and a hook flat in the feature root:
  - `RegistryDashboard.tsx`, `ServicesTable.tsx`, `StatsGrid.tsx`, `useRegistryStats.ts`
  - No `domain/`, `application/`, `infrastructure/`, `ui/` directories.
- `features/services/` uses non-standard `api/` and `components/` instead of DDD layers:
  - `api/api.ts`, `api/types.ts`
  - `components/InstancesPanel.tsx`, `components/OpenApiPanel.tsx`, etc.

**AGENTS.md requirement:** «Code is organized by features and layers: Domain, Application, Infrastructure, UI.»

---

### 2. `useQuery` Called Directly in UI Components

**Where:**
- `frontend/service-mesh/src/features/services/ServicesPage.tsx:12-17`
- `frontend/service-mesh/src/features/services/ServiceDetailPage.tsx:213-218`
- `frontend/service-mesh/src/features/services/components/OpenApiPanel.tsx:76-81`
- `frontend/service-mesh/src/features/registry/useRegistryStats.ts:41-46`

**Problem:** Server-state hooks (`useQuery`) are called directly inside React UI components instead of being encapsulated in the `application/` layer.

- `ServicesPage` calls `useQuery({ queryKey: registryKeys.list(), queryFn: registryApi.listServices })`
- `ServiceDetailPage` calls `useQuery({ queryKey: registryKeys.versions(serviceId), queryFn: () => registryApi.getServiceVersions(serviceId) })`
- `OpenApiPanel` (a presentational component) also calls `useQuery` directly.
- `useRegistryStats` lives in `features/registry/` root instead of `features/registry/application/`.

**AGENTS.md requirement:** «Application layer — Hooks, use cases, state management (TanStack Query hooks). Presentation layer should not know about query keys or API clients.»

---

### 3. Type Safety Violations: `any`, Unsafe Assertions, Inline Styles

**Where:**
- `frontend/service-mesh/src/shared/table/DataTable.tsx:12-13`
  - `// eslint-disable-next-line @typescript-eslint/no-explicit-any` + `columns: ColumnDef<TData, any>[]`
- `frontend/service-mesh/src/lib/http.ts:62`
  - `res.json() as Promise<T>` — force-casting the entire response body.
- `frontend/service-mesh/src/features/services/ServiceDetailPage.tsx:92`
  - `const doc = data as OpenApiDoc` — unsafe type assertion on API response.
- `frontend/service-mesh/src/features/services/ServiceDetailPage.tsx:98`
  - `const operation = op as OpenApiOperation` — unsafe assertion inside `Object.entries` loop.
- `frontend/service-mesh/src/features/services/ServiceDetailPage.tsx:28,57,122,124,181`
  - Multiple inline `style={{ ... }}` props instead of CSS Module classes.
- `frontend/service-mesh/src/features/registry/StatsGrid.tsx`
  - Inline styles: `style={{ color: 'var(--color-text-faint)' }}` etc.
- `frontend/service-mesh/src/features/routing-rules/ui/RulesTable/RulesTable.tsx:84`
  - Inline styles for empty state.
- `frontend/service-mesh/src/shared/table/DataTable.tsx:54`
  - Inline `style={onRowClick ? { cursor: 'pointer' } : undefined}`.

**AGENTS.md requirements:**
- «Anti-Pattern: Use `any`. Destroys type safety.»
- «Parse, don't validate. Decode at the boundary.»
- «CSS Modules + CSS custom properties — no Tailwind, write scoped styles in `*.module.css`.»

---

### 4. Complete Absence of Tests in `registry`, `services`, `shared`

**Where:**
- `frontend/service-mesh/src/features/registry/` — no tests
- `frontend/service-mesh/src/features/services/` — no tests
- `frontend/service-mesh/src/shared/table/DataTable.tsx` — no tests
- `frontend/service-mesh/src/shared/ui/` — no tests for design-system primitives
- `frontend/service-mesh/src/routes/` — no tests
- `frontend/service-mesh/src/components/layout/` — no tests
- `frontend/service-mesh/src/lib/http.ts` — no tests

**Problem:** Two of the three main features (`registry`, `services`) have zero test coverage. The only tests that exist are in `routing-rules` (`DestinationList.test.tsx`, `RulesTable.test.tsx`, `WeightBar.test.tsx`, `schema.test.ts`) and `shared/form/schemaResolver.test.ts`.

**AGENTS.md requirement:** «Frontend testing: Vitest + jsdom + React Testing Library. Minimum coverage target: 80%. Tests co-located.»

---

### 5. `ServiceDetailPage` Violates Single-Responsibility — Multiple Components + Duplicates

**Where:** `frontend/service-mesh/src/features/services/ServiceDetailPage.tsx`

**Problem:**
1. **File is 258 lines** and contains **8 exported/local components**:
   - `ManifestPanel`, `SpecCard`, `KV`, `OpenApiPanel`, `InstancesPanel`, `VersionCard`, `ServiceDetailPage`
   - Plus helper types `OpenApiOperation`, `OpenApiRoute`.
2. **Duplicate components exist**:
   - `OpenApiPanel` is defined inline in `ServiceDetailPage.tsx` (line 75) AND exists as a separate file `components/OpenApiPanel.tsx`.
   - `VersionCard` is defined inline in `ServiceDetailPage.tsx` (line 179) AND exists as a separate file `components/VersionCard.tsx`.

**AGENTS.md requirement:** «Entities per file: 1 aggregate root or major function — Extract into separate files.»

---

## 🟡 Medium Non-Compliance Issues

### 6. Domain Layer Polluted with UI Hooks and Side Effects

**Where:**
- `frontend/service-mesh/src/features/routing-rules/domain/useRoutingRulesUI.ts`
- `frontend/service-mesh/src/features/routing-rules/domain/useRoutingRulesMutations.ts`

**Problem:** Hooks that manage UI state (`useRoutingRulesUI`) and side effects/mutations (`useRoutingRulesMutations`) live in the `domain/` layer. Domain must be pure types and functions only.

**AGENTS.md requirement:** «Domain — Pure types, branded types, pure functions, business logic. No side effects.»

---

### 7. Naming Convention Violations

| Current Path | Should Be |
|---|---|
| `features/registry/useRegistryStats.ts` | `features/registry/application/useRegistryStats.application.ts` |
| `features/services/api/api.ts` | `features/services/infrastructure/api.infrastructure.ts` |
| `features/services/api/types.ts` | `features/services/domain/types.ts` |
| `features/routing-rules/infrastructure/api.ts` | `features/routing-rules/infrastructure/api.infrastructure.ts` |
| `features/routing-rules/infrastructure/mock.ts` | `features/routing-rules/infrastructure/mock.infrastructure.ts` |
| `shared/form/schemaResolver.ts` | `shared/form/schemaResolver.domain.ts` or `schemaResolver.application.ts` |

**AGENTS.md requirement:** «Naming conventions: `*.domain.ts`, `*.application.ts`, `*.infrastructure.ts`, `*.module.css`, etc.»

---

### 8. Missing Barrel Exports

**Where:**
- `frontend/service-mesh/src/features/registry/` — no `index.ts`
- `frontend/service-mesh/src/shared/table/` — no `index.ts`

**AGENTS.md requirement:** «Barrel exports — each feature exports its public API through `index.ts`.»

---

### 9. Non-Null Assertions in Application Hooks

**Where:** `frontend/service-mesh/src/features/routing-rules/application/useRoutingRules.ts:71-72`

**Problem:**
- `editRule!.id`
- `deleteRule!.id`

**AGENTS.md requirement:** «Explicit error handling — Result<T, E>. Avoid unsafe non-null assertions.»

---

### 10. `queryClient.ts` Duplicates `persister.ts` and Uses `window.localStorage` at Module Level

**Where:**
- `frontend/service-mesh/src/lib/queryClient.ts`
- `frontend/service-mesh/src/lib/persister.ts`

**Problem:** `queryClient.ts` creates its own `localStorage` persister inline, ignoring the existing `persister.ts` which provides an IDB-based persister with SSR-safe fallback. Additionally, `window.localStorage` is accessed at the top level of the module, which can crash in SSR environments.

**AGENTS.md requirement:** «Local-first — data is cached in localStorage via TanStack Query persist. Use idb-keyval / localStorage persister from `lib/persister.ts`.»

---

### 11. UI State Mixed with Server State in Application Hooks

**Where:** `frontend/service-mesh/src/features/routing-rules/application/useRoutingRules.ts:33-35`

**Problem:** `useState` for modal state (`editRule`, `deleteRule`) is mixed inside an application hook that should only manage server state. UI state should be handled by Zustand.

**AGENTS.md requirement:** «Zustand — used only for pure UI state. Application layer manages server state via TanStack Query.»

---

### 12. Massive Absence of JSDoc

**Where:** Nearly every exported function in the frontend.

**Problem:** Examples include `RegistryDashboard`, `ServicesTable`, `StatsGrid`, `useRegistryStats`, `ServicesPage`, `ServiceDetailPage`, `useRoutingRules`, `useRuleForm`, `routingRulesApi`, `registryApi`, `Header`, `Sidebar`, `useUIStore`, `DataTable`, etc.

**AGENTS.md requirement:** «Every exported function must have a JSDoc comment. Required fields: What it does, Parameters, Return value, Side effects, Domain invariants.»

---

## 🟢 Minor Non-Compliance Issues

### 13. Import File Extensions in Path Aliases

**Where:** Multiple files import with `.tsx` / `.ts` extensions in path aliases:
- `features/registry/ServicesTable.tsx:6` — `from "@/shared/table/DataTable.tsx"`
- `features/services/ServicesPage.tsx:8` — `from "@/features/registry/ServicesTable.tsx"`
- `features/routing-rules/application/useRuleForm.ts:4` — `from '@/shared/form/schemaResolver.ts'`
- `features/routing-rules/infrastructure/api.ts:5` — `from '@/lib/http.ts'`

### 14. Deep Imports Instead of Barrel Imports

**Where:**
- `features/services/ServiceDetailPage.tsx:7` — `import { Tabs, ... } from '@/shared/ui/Tabs'`
- `features/services/components/VersionCard.tsx:3` — `import { Tabs, ... } from '@/shared/ui/Tabs'`

Should import from `@/shared/ui` barrel.

### 15. Outdated Comment in Schema File

**Where:** `frontend/service-mesh/src/features/routing-rules/domain/schema.ts:12-16`

**Problem:** Comment says *"This file intentionally has no consumers yet"*, but `useRuleForm.ts` already imports `RuleFormSchema` from it.

### 16. Potentially Duplicate Route

**Where:** `frontend/service-mesh/src/routes/services.$serviceId.routing-rules.tsx`

**Problem:** This route exists as a standalone page, but `RoutingRulesPage` is also embedded inside `ServiceDetailPage` via `<Tabs>`. Creates architectural inconsistency.

---

## Summary Table

| Level | Count | Examples |
|---|---|---|
| 🔴 Critical | 5 | Missing DDD layers; useQuery in UI components; type safety violations (`any`, `as`, inline styles); zero tests in registry/services; ServiceDetailPage monolith + duplicates |
| 🟡 Medium | 7 | Domain layer polluted with hooks; naming violations; missing barrel exports; non-null assertions; queryClient duplicates persister.ts; UI state in application hooks; missing JSDoc |
| 🟢 Minor | 4 | Import file extensions; deep imports; outdated comment; duplicate route |
