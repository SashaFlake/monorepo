# Frontend Audit — Non-Compliance with AGENTS.md Requirements

> Audit date: 2026-06-08 (updated)
> Scope: `frontend/service-mesh/src/`
> Criteria: AGENTS.md (DDD layers, Effect, TanStack Query, CSS Modules, JSDoc, tests, etc.)

---

## ✅ Resolved Critical Issues (verified 2026-06-08)

The following critical issues were fixed in issues #62, #63, #64, #65, #66, #69:

| # | Issue | Resolution |
|---|---|---|
| 1 | Missing DDD Layers in `registry` and `services` | Both features now have `domain/`, `application/`, `infrastructure/`, `ui/` layers |
| 2 | `useQuery` called directly in UI components | All server-state hooks moved to `application/` layer; components receive data via props |
| 3 | Type safety violations (`any`, unsafe `as`, inline styles) | `ColumnDef` fixed, `lib/http.ts` uses `Schema.decodeUnknown`, inline styles removed |
| 4 | Complete absence of tests in `registry`, `services`, `shared` | Co-located tests added across all flagged areas; coverage baseline established |
| 5 | `ServiceDetailPage` monolith + duplicate components | File reduced from 258 → ~61 lines; sub-components extracted to separate files |

---

## 🟡 Medium Non-Compliance Issues (still open)

### 6. Domain Layer Polluted with UI Hooks and Side Effects

**Where:**
- `frontend/service-mesh/src/features/routing-rules/domain/useRoutingRulesUI.ts`
- `frontend/service-mesh/src/features/routing-rules/domain/useRoutingRulesMutations.ts`

**Problem:** Hooks that manage UI state (`useRoutingRulesUI`) and side effects/mutations (`useRoutingRulesMutations`) live in the `domain/` layer. Domain must be pure types and functions only.

**AGENTS.md requirement:** «Domain — Pure types, branded types, pure functions, business logic. No side effects.»

---

### 7. Naming Convention Violations

| Current Path | Should Be | Status |
|---|---|---|
| `features/routing-rules/infrastructure/api.ts` | `features/routing-rules/infrastructure/api.infrastructure.ts` | 🔴 open |
| `features/routing-rules/infrastructure/mock.ts` | `features/routing-rules/infrastructure/mock.infrastructure.ts` | 🔴 open |
| `shared/form/schemaResolver.ts` | `shared/form/schemaResolver.domain.ts` or `schemaResolver.application.ts` | 🔴 open |
| `features/registry/useRegistryStats.ts` | `features/registry/application/useRegistryStats.application.ts` | ✅ fixed |
| `features/services/api/api.ts` | `features/services/infrastructure/api.infrastructure.ts` | ✅ fixed (api/ removed) |
| `features/services/api/types.ts` | `features/services/domain/types.ts` | ✅ fixed (api/ removed) |

**AGENTS.md requirement:** «Naming conventions: `*.domain.ts`, `*.application.ts`, `*.infrastructure.ts`, `*.module.css`, etc.»

---

### 8. Missing Barrel Exports

**Where:**
- `frontend/service-mesh/src/shared/table/` — no `index.ts`

**Status:** `features/registry/index.ts` now exists (✅ fixed). `shared/table/index.ts` still missing (🔴 open).

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

**Problem:** Many exports still lack JSDoc. `registry/` feature has near-zero JSDoc coverage. `services/` and `shared/ui/` partially covered.

**AGENTS.md requirement:** «Every exported function must have a JSDoc comment. Required fields: What it does, Parameters, Return value, Side effects, Domain invariants.»

---

## 🟢 Minor Non-Compliance Issues

### 13. Import File Extensions in Path Aliases

**Where:** Multiple files import with `.tsx` / `.ts` extensions in path aliases:
- `features/routing-rules/application/useRuleForm.ts` — `from '@/shared/form/schemaResolver.ts'`
- `features/routing-rules/infrastructure/api.ts` — `from '@/lib/http.ts'`

**Status:** `features/registry/ServicesTable.tsx` and `features/services/ServicesPage.tsx` fixed (✅). `useRuleForm.ts` and `api.ts` still have extensions (🟡 partial).

---

### 14. Deep Imports Instead of Barrel Imports

**Status:** ✅ Fixed. No deep imports from `@/shared/ui/Tabs` found anywhere.

---

### 15. Outdated Comment in Schema File

**Where:** `frontend/service-mesh/src/features/routing-rules/domain/schema.ts`

**Status:** ✅ Fixed. Outdated "no consumers yet" comment removed.

---

### 16. Potentially Duplicate Route

**Where:** `frontend/service-mesh/src/routes/services.$serviceId.routing-rules.tsx`

**Status:** ✅ Fixed. Route no longer exists.

---

## Summary Table

| Level | Count | Examples |
|---|---|---|
| ✅ Resolved (was 🔴 Critical) | 5 | Missing DDD layers; useQuery in UI; type safety; zero tests; ServiceDetailPage monolith |
| 🟡 Medium | 7 | Domain hooks in routing-rules; naming violations; missing barrel exports; non-null assertions; queryClient dup; UI state in app hooks; missing JSDoc |
| 🟢 Minor | 1 (3 fixed) | Import file extensions (partial) |
