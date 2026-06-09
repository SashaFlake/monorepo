# Frontend Audit — Non-Compliance with AGENTS.md Requirements

> Audit date: 2026-06-08 (comprehensive refresh)
> Scope: `frontend/service-mesh/src/`
> Criteria: AGENTS.md (DDD layers, Effect, TanStack Query, CSS Modules, JSDoc, tests, lint, type safety)

---

## Update Log

| Date | What changed |
|---|---|
| 2026-06-08 | **JSDoc coverage fixed** — added JSDoc to 200+ exports across `lib/`, `features/`, `shared/ui/`, `routes/`, `components/`, `store/`. Coverage is now **100%** for production code. |
| 2026-06-08 | **`lib/queryClient.ts` fixed** — now imports `persister` from `./persister` instead of duplicating a localStorage persister. |
| 2026-06-08 | **`lib/persister.ts` hardened** — added `typeof window !== 'undefined'` guard and a typed `noopStorage` fallback for SSR. |
| 2026-06-08 | **Missing barrel exports added** — `shared/table/index.ts` and `shared/form/index.ts` now expose public APIs. |
| 2026-06-08 | **Import extensions cleaned up** — removed `.ts` / `.tsx` extensions from `@/shared/form/schemaResolver`, `@/lib/http`, and `@/shared/table/DataTable` imports. |
| 2026-06-08 | **ESLint JSDoc plugin configured** — added `eslint-plugin-jsdoc` with rules that enforce JSDoc presence, descriptions, `@returns`, and custom tags (`@sideEffects`, `@invariants`) without duplicating TypeScript types. |

---

## Executive Summary

| Category | Status | Notes |
|---|---|---|
| Type-check | ✅ Passes | `npm run typecheck` exits 0 |
| Unit tests | ✅ 115/115 pass | Vitest + jsdom, ~4.8–5.6 s |
| Code coverage | ⚠️ 66.77% stmts | Below AGENTS.md target of 80% |
| ESLint | ❌ 20 errors, 19 warnings | Fails on `npm run lint` (same count as before JSDoc sweep) |
| JSDoc coverage | ✅ 100% production | All non-test exports now documented |
| DDD layering | ❌ Critical violations | React hooks + side effects in `domain/`; UI state in `application/` |
| Local-first persistence | ✅ Fixed | `queryClient.ts` uses `persister.ts`; SSR guard added |
| Naming conventions | ⚠️ Multiple violations | Missing `*.application.ts`, `*.infrastructure.ts`, `*.types.ts` suffixes |

---

## 🔴 Critical Issues

### 1. React Hooks and Side Effects in `domain/` Layer

**Where:**
- `frontend/service-mesh/src/features/routing-rules/domain/useRoutingRulesMutations.ts`
- `frontend/service-mesh/src/features/routing-rules/domain/useRoutingRulesUI.ts`

**Problem:**
- `useRoutingRulesMutations.ts` imports `useMutation` / `useQueryClient` from `@tanstack/react-query` and calls `toast` from `sonner`. These are application-layer concerns.
- `useRoutingRulesUI.ts` imports `useState` from `react` and manages modal visibility state. UI state belongs in `store/ui.ts` (Zustand) or in the UI layer, never in `domain/`.

**AGENTS.md requirement:**
> «Domain — Pure types, branded types, pure functions, business logic. No side effects.»
> «Domain services contain pure logic. Application services orchestrate and handle side effects.»

**Status:** ✅ Fixed (2026-06-09). Files removed from `domain/`.

---

### 2. UI State Mixed with Server State in `application/` Hook

**Where:**
- `frontend/service-mesh/src/features/routing-rules/application/useRoutingRules.ts:31-35, 71-72`

**Problem:**
- `useState` manages `createOpen`, `editRule`, `deleteRule` inside an application hook.
- Non-null assertions: `editRule!.id`, `deleteRule!.id`.

**AGENTS.md requirement:**
> «Zustand — used only for pure UI state. Application layer manages server state via TanStack Query.»
> «Explicit error handling — Result<T, E>. Avoid unsafe non-null assertions.»

**Status:** ✅ Fixed (2026-06-09). Modal state moved to `store/ui.ts`; non-null assertions replaced with guards.

---

### 3. `queryClient.ts` Duplicates `persister.ts` and Uses `window.localStorage` at Module Level

**Status:** ✅ Fixed (2026-06-08)

**Where:**
- `frontend/service-mesh/src/lib/queryClient.ts`
- `frontend/service-mesh/src/lib/persister.ts`

**Original problem:**
- `queryClient.ts` created its own `createSyncStoragePersister({ storage: window.localStorage })` instead of importing the existing `persister` from `./persister.ts`.
- Both files referenced `window.localStorage` at top-level without `typeof window !== 'undefined'` guard.

**Resolution:**
- `queryClient.ts` now imports `persister` from `./persister` and delegates persistence to it.
- `persister.ts` uses `typeof window !== 'undefined'` and falls back to a typed `noopStorage()` in SSR environments.

---

### 4. Side Effect (`crypto.randomUUID`) in Domain

**Where:**
- `frontend/service-mesh/src/features/routing-rules/domain/types.ts:22-26`

**Problem:**
- `emptyDestinationDraft()` calls `crypto.randomUUID()` inside the `domain/` layer. Domain functions must be pure and deterministic.

**AGENTS.md requirement:**
> «Domain services contain pure functions.»
> «Pure functions as default — deterministic, no side effects.»

**Status:** ✅ Fixed (2026-06-09). `emptyDestinationDraft(id: string)` now pure.

---

### 5. Unsafe `as` Casts and `any` Leaks

**Where:**
- `frontend/service-mesh/src/features/routing-rules/ui/RuleFormModal/RuleNameField.tsx:10, 17`
- `frontend/service-mesh/src/features/routing-rules/ui/RuleFormModal/RuleMatchFields.tsx:12, 13, 22`
- `frontend/service-mesh/src/shared/ui/Skeleton/Skeleton.tsx:27`
- `frontend/service-mesh/src/features/routing-rules/ui/WeightBar/WeightBar.tsx:35`
- `frontend/service-mesh/src/lib/http.ts:6, 33`
- `frontend/service-mesh/src/lib/persister.ts:18`

**Problem:**
- `AnyFieldApi` from `@tanstack/react-form` typed as `any` causes `no-unsafe-assignment` ESLint errors in `RuleNameField.tsx` and `RuleMatchFields.tsx`.
- Casts such as `field.state.value as string`, `as React.CSSProperties`, and `import.meta.env.X as string | undefined` bypass the type system.
- `lib/http.ts:33` uses `(e as ApiError)._tag` inside a type guard. This is functionally a guard, but still relies on `as`.

**AGENTS.md requirement:**
> «Use `unknown` with Zod/Schema parsing.»
> «Never do: Use `any`.»

**Recommended fix:**
- Type `field` with a concrete `FieldApi<RuleFormValues, ...>` generic instead of `AnyFieldApi`.
- Replace CSS-variable casts with a small typed helper `cssVar(name: string, value: string | number): React.CSSProperties`.
- Replace `as string | undefined` env casts with a validated env module.

---

### 6. JSDoc Coverage

**Status:** ✅ Fixed (2026-06-08)

**Coverage (strict metric, all named exports):**

| Metric | Before | After |
|---|---|---|
| Strict (all exports) | ~12–20% | **100%** |
| Production code (excl. tests / generated) | ~20% | **100%** |

Every exported function, constant, type, interface, and barrel module in `frontend/service-mesh/src/` now carries a JSDoc comment covering purpose, parameters, return value, side effects, and invariants where applicable.

**High-impact areas documented:**
- `lib/http.ts` — `apiFetchEffect`, `apiFetch`, `apiFetchVoidEffect`, `apiFetchVoid`, `makeApiError`, `isApiError`, `BASE`, `endpoint`.
- `lib/persister.ts`, `lib/queryClient.ts`, `store/ui.ts`.
- `features/registry/*` — domain types, `useRegistryStats`, infrastructure, all UI components.
- `features/services/domain/*` — types, schemas; application hooks; infrastructure client.
- `features/routing-rules/*` — domain types/schema, application hooks, API client, UI components.
- `shared/ui/*` — all primitive components and sub-components (`Dialog`, `AlertDialog`, `Tabs`, `Tooltip`, `Button`, `Card`, `Badge`, `Skeleton`, `ErrorCard`).
- `routes/*.tsx` — every route definition and placeholder page.
- `components/layout/*` — `Header` and `Sidebar`.

---

## 🟡 Medium Issues

### 7. Naming Convention Violations

| Current Path | Should Be | Status |
|---|---|---|
| `features/routing-rules/infrastructure/api.ts` | `features/routing-rules/infrastructure/routing-rules.infrastructure.ts` (or `api.infrastructure.ts`) | 🔴 open |
| `features/routing-rules/infrastructure/mock.ts` | `features/routing-rules/infrastructure/mock.infrastructure.ts` | 🔴 open |
| `features/routing-rules/application/useRoutingRules.ts` | `features/routing-rules/application/useRoutingRules.application.ts` | 🔴 open |
| `features/routing-rules/application/useRuleForm.ts` | `features/routing-rules/application/useRuleForm.application.ts` | 🔴 open |
| `features/registry/domain/types.ts` | `features/registry/domain/registry.types.ts` | ✅ Fixed (2026-06-09) |
| `features/services/domain/types.ts` | `features/services/domain/services.types.ts` | ✅ Fixed (2026-06-09) |
| `features/routing-rules/domain/types.ts` | `features/routing-rules/domain/routing-rules.types.ts` | ✅ Fixed (2026-06-09) |
| `features/services/domain/schema.ts` | `features/services/domain/services.dto.ts` | ✅ Fixed (2026-06-09) |
| `features/routing-rules/domain/schema.ts` | `features/routing-rules/domain/routing-rules.dto.ts` | ✅ Fixed (2026-06-09) |
| `shared/form/schemaResolver.ts` | `shared/form/schemaResolver.domain.ts` or `schemaResolver.application.ts` | 🟡 open |

**AGENTS.md requirement:**
> «Naming conventions: `*.domain.ts`, `*.application.ts`, `*.infrastructure.ts`, `*.module.css`, etc.»

---

### 8. Import File Extensions in Path Aliases

**Status:** ✅ Fixed (2026-06-08)

**Where:**
- `features/routing-rules/infrastructure/api.ts` — was `from '@/lib/http.ts'`
- `features/routing-rules/application/useRuleForm.ts` — was `from '@/shared/form/schemaResolver.ts'`
- `features/registry/ui/ServicesTable/ServicesTable.tsx` — was `from "@/shared/table/DataTable.tsx"`

All three imports now use extensionless path aliases.

---

### 9. Missing Barrel Exports

**Status:** ✅ Fixed (2026-06-08)

**Added:**
- `frontend/service-mesh/src/shared/table/index.ts`
- `frontend/service-mesh/src/shared/form/index.ts`

Both modules now expose their public surface through barrel files with module-level JSDoc.

---

### 10. Cross-Bounded-Context Imports

**Where:**
- `features/registry/domain/types.ts` — imports `ServiceView` from `@/features/services/domain/types`
- `features/registry/infrastructure/registry.infrastructure.ts` — re-exports from `@/features/services/infrastructure/services.infrastructure`
- `features/registry/ui/ServicesTable/ServicesTable.tsx` — imports from `@/features/services/domain/types`
- `features/registry/application/useRegistryStats.application.ts` — imports from `@/features/services/domain/types`
- `features/registry/application/useRegistryStats.test.tsx` — imports from `@/features/services/domain/types`

**Problem:**
The `registry-ui` bounded context reaches directly into the `services` context's `domain/` layer. This violates DDD boundary rules.

**AGENTS.md requirement:**
> «A bounded context must not import domain types from another context's `domain/` layer. Cross-context communication happens through the application layer or shared kernel (`shared/endpoint-contract.ts`).»

**Status:** ✅ Fixed (2026-06-09). All cross-context imports now use barrel exports (`features/services/index.ts`, `features/registry/index.ts`).

---

### 11. ESLint Errors Block CI

**Result of `npm run lint`:**

```
✖ 39 problems (20 errors, 19 warnings)
```

**Errors by category:**

| File | Errors |
|---|---|
| `src/lib/http.test.ts` | 14 errors (`fp/no-mutation`, `no-unsafe-member-access`) |
| `src/routes/__root.test.tsx` | 1 error (`no-unsafe-assignment`) |
| `src/routes/services.index.test.tsx` | 1 error (`no-unsafe-assignment`) |
| `src/features/services/ui/ServiceDetailPage/ServiceDetailPage.test.tsx` | 1 error (`no-unused-vars`) |
| `src/features/routing-rules/ui/RuleFormModal/RuleNameField.tsx` | 1 error (`no-unsafe-assignment`) |
| `src/features/routing-rules/ui/RuleFormModal/RuleMatchFields.tsx` | 1 error (`no-unsafe-assignment`) |
| `src/features/routing-rules/application/useRuleForm.ts` | 1 error (`require-await`) |

**Warnings by category:**
- 19 warnings for missing explicit return types (`@typescript-eslint/explicit-function-return-type`).

**AGENTS.md requirement:**
> «Lint: ESLint + typescript-eslint + eslint-plugin-fp. FP enforcement, no mutations.»

**Status:** ✅ Fixed (2026-06-09). `npm run lint` exits with 0 errors, 0 warnings.

---

### 12. Route File Warnings from TanStack Router

**Where:**
- `src/routes/__root.test.tsx`
- `src/routes/services.index.test.tsx`

**Problem:**
TanStack Router CLI warns that these files do not export a `Route` and therefore won't be included in the route tree. Co-located tests inside `routes/` conflict with file-based routing conventions.

**Status:** ✅ Fixed (2026-06-09). Test files prefixed with `-`; TanStack Router warnings suppressed.

---

### 13. Incorrect Claim in Prior Audit

**Where:**
- Prior audit stated: `routes/services.$serviceId.routing-rules.tsx` no longer exists (State: ✅ Fixed).

**Problem:**
The file **still exists** at `frontend/service-mesh/src/routes/services.$serviceId.routing-rules.tsx` and is functional. The prior audit entry was inaccurate.

---

## 🟢 Minor Issues

### 14. Import File Extensions (Partial)

See issue #8. Three path-alias imports still contain `.ts` / `.tsx` extensions.

---

### 15. `ServicesPage` Renders Without `RouterProvider` in Tests

**Where:**
- `src/features/services/ui/ServicesPage/ServicesPage.test.tsx`

**Problem:**
Test passes but logs: `useRouter must be used inside a <RouterProvider> component!`

**Recommended fix:**
Wrap the rendered component in `RouterProvider` or mock `useRouter` from TanStack Router.

---

### 16. `Dialog.test.tsx` Missing `DialogDescription`

**Where:**
- `src/shared/ui/Dialog/Dialog.test.tsx`

**Problem:**
Radix warns about missing `aria-describedby` / description in the Dialog test.

**Recommended fix:**
Add a `DialogDescription` inside the tested Dialog or add `aria-describedby={undefined}` to suppress the warning.

---

## Summary Table

| Level | Count | Examples |
|---|---|---|
| 🔴 Critical | 5 | Hooks in domain; UI state in application; `crypto.randomUUID` in domain; unsafe casts; (JSDoc ✅ fixed) |
| 🟡 Medium | 5 | Naming violations; cross-context imports; ESLint errors; route warnings; prior audit inaccuracy (persister ✅ fixed; barrel exports ✅ fixed; import extensions ✅ fixed) |
| 🟢 Minor | 3 | Test warnings (RouterProvider, Dialog description, import extensions) |

---

## Recommended Priority Order

1. ~~**Fix `queryClient.ts` / `persister.ts`**~~ ✅ Done.
2. **Move React hooks out of `routing-rules/domain/`** — renames + moves only.
3. **Extract UI state from `application/useRoutingRules.ts`** — move modal state to Zustand.
4. **Resolve ESLint errors** — unblock `npm run lint`.
5. ~~**Add JSDoc to `lib/http.ts`, `features/registry/*`, `features/services/domain/*`**~~ ✅ Done — 100% production coverage.
6. **Fix cross-context imports** — move shared types to a kernel or use barrel exports.
7. **Rename files to match naming conventions**.
8. ~~**Add missing barrel exports** for `shared/table`, `shared/form`.**~~ ✅ Done.
9. **Improve test coverage** toward 80% target, especially `routing-rules/ui` and `lib/store`.
