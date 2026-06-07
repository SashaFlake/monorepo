# GitHub Issues #26–#50 — SashaFlake/monorepo
Всего в диапазоне: 25 issues/PRs
---

## [PR #26] fix(routing-rules): update imports to new subfolder paths, translate …
- **State:** closed
- **Created:** 2026-04-28 | **URL:** https://github.com/SashaFlake/monorepo/pull/26

…strings to English

chore(routing-rules): remove old flat component files after subfolder migration

refactor(routing-rules): group components into subfolders by UI role

- RuleFormModal/ — modal shell + all form fields
- RulesTable/    — table with test
- DeleteRuleDialog/ — confirm dialog
- WeightBar/     — reusable primitive with test

Fixed relative imports after move.
Translated remaining Russian strings and aria-labels to English. Updated RulesTable.test.tsx selectors to match English strings.

refactor(routing-rules): rename values -> rule in useRuleForm and RuleFormModal

refactor(routing-rules): translate all comments and JSDoc to English in useRuleForm

refactor(routing-rules): add JSDoc, explicit return type, grouping and useMemo to useRuleForm

chore: remove features/services/types.ts — прокси-обёртка больше не нужна

chore: remove lib/api.ts — moved to features/services/api/

refactor(arch): move services domain from lib/api.ts → features/services/api/

- features/services/api/types.ts — все типы домена (ServiceView, InstanceView, MockManifest, OpenApiDoc...)
- features/services/api/api.ts — registryApi + registryKeys, использует lib/http.ts
- обновлены импорты в ServicesPage, ServiceDetailPage, ServicesTable, useRegistryStats
- удалены lib/api.ts и features/services/types.ts (прокси-обёртка)

refactor(arch): extract lib/http.ts, split api by domain

- lib/http.ts — shared apiFetch helper, single source of truth
- lib/api.ts — services domain only (registryApi + registryKeys + types)
- features/routing-rules/api/api.ts — uses lib/http.ts, no duplicate fetch logic
- routing-rules types live exclusively in model/types.ts

fix(routing-rules): move header outside <form>, add type=button to close btn

improve(routing-rules): a11y, form semantics, fieldset disabled, stable callbacks in RuleFormModal

- Wrap modal in <dialog> with Escape key + overlay click to close
- Wrap fields in <form onSubmit> so Enter submits natively
- <fieldset disabled={isPending}> disables all inputs during save
- Extract setPathPrefix into useRuleForm to avoid inline arrow on each render

fix(services): remove unused 'i' variable in OpenApiPanel routes.map

fix(routing-rules): remove unused 'i' variable in DestinationList

fix(routing-rules): align RuleFormModal + useRuleForm with DestinationList onChange contract

DestinationList.onChange expects (destinations: Destination[]) => void—replace granular onAdd/onRemove/onChange handlers with setDestinations in the hook.

refactor(routing-rules): extract useRuleForm hook + split RuleFormModal into focused components

- Add hooks/useRuleForm.ts — all form state, validation, and mutation handlers
- Add RuleNameField.tsx — name input with error display
- Add RuleMatchFields.tsx — priority + path prefix row
- Refactor RuleFormModal.tsx — now pure shell: composes sub-components, no inline logic
---

## [PR #27] Choir frontend linter fix
- **State:** closed
- **Created:** 2026-05-04 | **URL:** https://github.com/SashaFlake/monorepo/pull/27
---

## [PR #28] Choir frontend linter fix
- **State:** closed
- **Created:** 2026-05-04 | **URL:** https://github.com/SashaFlake/monorepo/pull/28
---

## [PR #29] Service mesh
- **State:** closed
- **Created:** 2026-05-04 | **URL:** https://github.com/SashaFlake/monorepo/pull/29
---

## [PR #30] Add agent configuration files for Backend, Frontend, Infra, and Full-…
- **State:** closed
- **Created:** 2026-05-04 | **URL:** https://github.com/SashaFlake/monorepo/pull/30

…Stack
---

## [PR #31] feat: frontend Dockerfile improvements + CI workflow
- **State:** closed
- **Created:** 2026-05-04 | **URL:** https://github.com/SashaFlake/monorepo/pull/31

## Что сделано

### Dockerfile (`service-mesh/frontend/service-mesh/Dockerfile`)
- Разделён на 3 стейджа: `deps` → `builder` → `runtime` (кэш node_modules не инвалидируется при изменении кода)
- `npm install --frozen-lockfile` заменён на `npm ci` (стандартный CI-способ установки, читает `package-lock.json`)
- Добавлен `HEALTHCHECK` для k8s liveness probe

### CI workflow (`.github/workflows/frontend-ci.yml`)
- **Триггер**: любой push в не-`main` ветку + PR в `main`, только при изменениях в `service-mesh/frontend/**`
- **Job `quality`**: `npm ci` → `lint` → `typecheck` → `test`
- **Job `docker`**: запускается после `quality`; собирает образ и пушит в GHCR с тегами по ветке, PR и SHA
- Кэш Docker слоёв через GitHub Actions Cache (`cache-from/to: type=gha`)
- `VITE_API_URL` берётся из `vars.VITE_API_URL` (Repository Variable) с fallback на `localhost:4000`

## Что нужно настроить в репозитории
- `Settings → Variables → Actions` → добавить `VITE_API_URL` (например `https://api.your-cluster.cloud.ru`)
- Разрешить запись в GHCR: `Settings → Actions → General → Workflow permissions → Read and write`
---

## [PR #32] frontend/action-plan
- **State:** closed
- **Created:** 2026-05-06 | **URL:** https://github.com/SashaFlake/monorepo/pull/32
---

## [Issue #33] refactor(DestinationList): patch-подход в функции update
- **State:** closed | **Labels:** refactor, frontend
- **Created:** 2026-05-06 | **URL:** https://github.com/SashaFlake/monorepo/issues/33

**Источник:** [PR #32, комментарий](https://github.com/SashaFlake/monorepo/pull/32#discussion_r3193353024)
**Файл:** `service-mesh/frontend/service-mesh/src/features/routing-rules/components/DestinationList/DestinationList.tsx`, line 24

Функция `update` принимает три отдельных параметра `(id, version, weightPct)`. Caller обязан передавать оба значения даже когда меняет только одно — это скрытая семантика.

Заменить на `patch`-подход:

```ts
const update = (id: string, patch: Partial<Pick<DestinationDraft, 'version' | 'weightPct'>>): void =>
  onChange(
    destinations.map((d): DestinationDraft =>
      d.id === id ? { ...d, ...patch } : d
    )
  )
```

Тогда callsite явно показывает что меняется:
```tsx
onChange={(e): void => update(item.id, { version: e.target.value })}
onChange={(e): void => update(item.id, { weightPct: Number(e.target.value) })}
```
---

## [Issue #34] bug(WeightBar): key={item.version || i} нестабилен при пустой version
- **State:** closed | **Labels:** bug, frontend
- **Created:** 2026-05-06 | **URL:** https://github.com/SashaFlake/monorepo/issues/34

**Источник:** [PR #32, комментарий](https://github.com/SashaFlake/monorepo/pull/32#discussion_r3193355682)
**Файл:** `service-mesh/frontend/service-mesh/src/features/routing-rules/components/WeightBar/WeightBar.tsx`, line 24

`key={item.version || i}` — если два destination имеют пустую `version` (`''`), оба получат `key=0` и `key=1` — при перестановке элементов React переустановит не те DOM-узлы.

`WeightBar` уже получает `DestinationDraft` с `.id` — использовать его:

```tsx
// segment
<div key={item.id} ... />

// legend
<div key={item.id} className={styles.legendItem}>
```

Исправить в обоих местах (track и legend).
---

## [Issue #35] refactor(RuleFormModal): заменить window.confirm на <ConfirmDialog>
- **State:** closed | **Labels:** refactor, frontend, ux
- **Created:** 2026-05-06 | **URL:** https://github.com/SashaFlake/monorepo/issues/35

**Источник:** [PR #32, комментарий](https://github.com/SashaFlake/monorepo/pull/32#discussion_r3193359096)
**Файл:** `service-mesh/frontend/service-mesh/src/features/routing-rules/components/RuleFormModal/RuleFormModal.tsx`, line 29

`window.confirm` блокирует event loop, не работает в изолированных iframe, в Electron/Tauri может быть силенсирован полностью.

**План:**
1. Вынести `DeleteRuleDialog` в generic `ConfirmDialog` в `src/components/ui/`
2. Создать `DiscardDialog` как тонкую обёртку `ConfirmDialog`
3. В `RuleFormModal` добавить `useState<boolean>` для `showDiscard`
4. В `requestClose` — если `form.isDirty` → `setShowDiscard(true)`, иначе `onClose()`

```tsx
{showDiscard && (
  <DiscardDialog
    onConfirm={onClose}
    onCancel={(): void => setShowDiscard(false)}
  />
)}
```
---

## [Issue #36] investigate(useRuleForm): проверить DestinationDraftEq не сравнивает .id
- **State:** closed | **Labels:** frontend, investigate
- **Created:** 2026-05-06 | **URL:** https://github.com/SashaFlake/monorepo/issues/36

**Источник:** [PR #32, комментарий](https://github.com/SashaFlake/monorepo/pull/32#discussion_r3193362418)
**Файл:** `service-mesh/frontend/service-mesh/src/features/routing-rules/hooks/useRuleForm.ts`, line 12

`toFormValues` вызывает `crypto.randomUUID()` при инициализации. Если `DestinationDraftEq` сравнивает `.id` — при повторном вызове `toFormValues` новые UUID будут отличаться от `initial`, и `isDirty` вернёт `true` без изменений.

**Требуется:**
- Проверить реализацию `DestinationDraftEq` — если `.id` не сравнивается, проблемы нет
- Если сравнивает — исправить `DestinationDraftEq` исключать `.id` из сравнения, либо добавить тест подтверждающий поведение
---

## [Issue #37] investigate(api): стрипповать destination.id перед отправкой на backend
- **State:** closed | **Labels:** frontend, investigate, backend
- **Created:** 2026-05-06 | **URL:** https://github.com/SashaFlake/monorepo/issues/37

**Источник:** [PR #32, комментарий](https://github.com/SashaFlake/monorepo/pull/32#discussion_r3193366048)
**Файл:** `service-mesh/frontend/service-mesh/src/features/routing-rules/api/api.ts`, line 33

PUT-тело отправляет `destinations` с `id` из `DestinationDraft`. Если backend не ожидает `id` в payload — запрос будет отклонён.

Проверить schema на backend. Если `id` не принимается — стрипповать перед отправкой:

```ts
destinations: form.destinations.map(({ version, weightPct }) => ({ version, weightPct }))
```
---

## [Issue #38] refactor(mock): заменить crypto.randomUUID() на фиксированные id в mock-данных
- **State:** closed | **Labels:** refactor, frontend, testing
- **Created:** 2026-05-06 | **URL:** https://github.com/SashaFlake/monorepo/issues/38

**Источник:** [PR #32, комментарий](https://github.com/SashaFlake/monorepo/pull/32#discussion_r3193367711)
**Файл:** `service-mesh/frontend/service-mesh/src/features/routing-rules/api/mock.ts`, line 11

`crypto.randomUUID()` в модульном скопе генерирует новые id при каждом `import`. Снэпшот-тесты для destination id непредсказуемы.

Заменить на фиксированные id:

```ts
Destination.unsafe({ id: 'dst-mock-1', version: 'v2', weightPct: 80 })
Destination.unsafe({ id: 'dst-mock-2', version: 'v1', weightPct: 20 })
Destination.unsafe({ id: 'dst-mock-3', version: 'v1', weightPct: 100 })
```
---

## [Issue #39] bug(Skeleton): хардкодные цвета не работают в тёмной теме
- **State:** closed | **Labels:** bug, frontend, dark-mode
- **Created:** 2026-05-06 | **URL:** https://github.com/SashaFlake/monorepo/issues/39

**Источник:** [PR #32, комментарий](https://github.com/SashaFlake/monorepo/pull/32#discussion_r3193369716)
**Файл:** `service-mesh/frontend/service-mesh/src/components/ui/Skeleton.module.css`, line 12

`Skeleton.module.css` использует хардкодные `#f0f0f0` / `#e0e0e0`. В тёмной теме — светлые полосы на тёмном фоне.

Заменить на CSS-токены:

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface-offset) 25%,
    var(--color-surface-dynamic) 50%,
    var(--color-surface-offset) 75%
  );
  background-size: 200px 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
  display: inline-block;
}
```
---

## [Issue #40] bug(RoutingRulesPage): RulesTable рендерится в состоянии ошибки
- **State:** closed | **Labels:** bug, frontend
- **Created:** 2026-05-06 | **URL:** https://github.com/SashaFlake/monorepo/issues/40

**Источник:** [PR #32, комментарий](https://github.com/SashaFlake/monorepo/pull/32#discussion_r3193371352)
**Файл:** `service-mesh/frontend/service-mesh/src/features/routing-rules/RoutingRulesPage.tsx`, line 35

`<RulesTable>` рендерится всегда — даже при `isError = true`. При ошибке `rules = []`, пользователь видит и `error`-сообщение, и empty-state таблицы одновременно.

Исправить:

```tsx
{isError   && <ErrorCard message="Failed to load routing rules." onRetry={refetch} />}
{isLoading && <Skeleton />}
{!isError && !isLoading && (
  <RulesTable rules={rules} onEdit={openEdit} onDelete={...} isPending={isDeleting} />
)}
```
---

## [Issue #41] refactor(ErrorCard): убрать дублирование импорта ReactNode
- **State:** closed | **Labels:** refactor, frontend
- **Created:** 2026-05-06 | **URL:** https://github.com/SashaFlake/monorepo/issues/41

**Источник:** [PR #32, комментарий](https://github.com/SashaFlake/monorepo/pull/32#discussion_r3193372724)
**Файл:** `service-mesh/frontend/service-mesh/src/components/ui/ErrorCard.tsx`, line 13

Можно убрать отдельный импорт `ReactNode` и использовать `React.ReactNode` напрямую, либо привести к единому стилю с остальными компонентами (`import type { ReactElement, ReactNode } from 'react'`).

Небольшой рефакторинг для консистентности кодебазы.
---

## [Issue #42] test(backend): добавить тест destinations: [] должен возвращать 400
- **State:** closed | **Labels:** backend, testing
- **Created:** 2026-05-06 | **URL:** https://github.com/SashaFlake/monorepo/issues/42

**Источник:** [PR #32, комментарий](https://github.com/SashaFlake/monorepo/pull/32#discussion_r3193373807)
**Файл:** `service-mesh/backend/service-mesh/src/modules/routing-rules/presentation/routing-rule.http.test.ts`, line 82

Покрыты 3 новых кейса валидации `destinations[]`, но не хватает одного:

```ts
it('rejects empty destinations array with 400', async () => {
  const res = await postRoutingRule(app, serviceId, {
    destinations: [],
  })
  assert.equal(res.statusCode, 400)
})
```

Если валидация обязывает `destinations.length >= 1` — этот тест должен быть.
---

## [PR #43] chore: remove tailwindcss
- **State:** closed
- **Created:** 2026-05-09 | **URL:** https://github.com/SashaFlake/monorepo/pull/43

## Что сделано

Удалён TailwindCSS из frontend-приложения.

### Изменения

- **`package.json`** — удалены зависимости `tailwindcss` и `@tailwindcss/vite`
- **`vite.config.ts`** — убран импорт и плагин `tailwindcss()`
- **`src/index.css`** — удалена директива `@import "tailwindcss"`

### После мержа

Запустить `npm install` в `service-mesh/frontend/service-mesh/` для обновления `package-lock.json`.
---

## [PR #44] refactor(frontend): introduce shared/ui structure for primitives
- **State:** closed
- **Created:** 2026-05-09 | **URL:** https://github.com/SashaFlake/monorepo/pull/44

## What

PR 1 from the [UI refresh plan](docs/ui-refresh-plan.md). Pure structural refactor — no behavior change.

- Move existing UI primitives (`Button`, `Card`, `Badge`, `Skeleton`, `ErrorCard`) from `src/components/ui` to `src/shared/ui/<Component>/` with per-component folders.
- Each component folder gets an `index.ts` barrel.
- Top-level `src/shared/ui/index.ts` lets features import everything from a single path: `import { Button, Card } from '@/shared/ui'`.
- Reserve `src/shared/form` and `src/shared/table` for the upcoming TanStack Form + `effect/Schema` (PR 3) and TanStack Table (PR 4) layers. README in each explains intent.
- All 16 import sites in `features/` and `routes/` are updated.
- Move `UI_REFRESH_PLAN.md` from the frontend project to `docs/ui-refresh-plan.md` next to the existing architecture docs.

## Why

The current `components/ui/` lives at the same level as feature folders, which makes the boundary between "shared primitives" and "domain UI" unclear. The new layout matches the DDD layering we want for the rest of the frontend (PR 3 introduces `domain/`, `application/`, `infrastructure/`, `ui/` per feature) and gives the upcoming Radix wrappers a natural home.

## Side fixes (drive-by)

- Commit `package-lock.json`. The frontend CI (`.github/workflows/frontend-ci.yml`) requires it via `npm ci` and `cache-dependency-path`; without it the workflow fails at the `Setup Node.js` step (verified on the last 5 runs).
- Promote `clsx` from a transitive to an explicit dependency. `Card.tsx` already imports it.
- Ignore `src/routeTree.gen.ts` — TanStack Router regenerates it on every `tsr generate`, so it should not be tracked.

## Verification

```
npm run typecheck  ok
npm run lint       ok
npm run build      ok (24.25 kB css / 491.62 kB js — unchanged)
npm test           33/34 pass
```

The one failing test (`RulesTable › opens confirmation dialog on delete button click`) already failed on `main` before this PR — it uses `screen.getByText(/my-rule/)` which now matches both the table row and the dialog. It will be fixed in PR 2 when `DeleteRuleDialog` migrates to Radix `AlertDialog`.

## What's next

- **PR 2** — Radix `Dialog` and `AlertDialog` wrappers, migrate `RuleFormModal` and `DeleteRuleDialog`, drop ~80 lines of imperative `<dialog>` glue.
- PR 3 — TanStack Form + `effect/Schema`, replace `useRuleForm`.
- PR 4 — TanStack Table, replace handwritten `RulesTable` / `ServicesTable`.
- PR 5 — Radix Tabs in `ServiceDetailPage`, Sonner for toasts.
---

## [PR #45] feat(frontend): migrate RuleFormModal and DeleteRuleDialog to Radix
- **State:** closed
- **Created:** 2026-05-09 | **URL:** https://github.com/SashaFlake/monorepo/pull/45

> Stacked on top of [#44](../pull/44). Once #44 merges, this PR will retarget to `main` automatically (or rebase cleanly).

PR 2 from the [UI refresh plan](docs/ui-refresh-plan.md). Replace handwritten imperative dialogs with two headless wrappers built on Radix UI.

## What

### `shared/ui/Dialog`
Thin wrapper over `@radix-ui/react-dialog`. Composes Portal + Overlay + Content with our existing design tokens (`--color-surface`, `--radius-xl`, `--shadow-lg`, `oklch` backdrop). Exposes:

- `Dialog` — Radix root, takes `open` + `onOpenChange`.
- `DialogContent` — Portal/Overlay/Content + `size: 'md' | 'sm'`. Forwards `onInteractOutside` / `onEscapeKeyDown` so callers can veto closing.
- `DialogHeader` (with `withIcon` variant), `DialogTitle`, `DialogDescription`, `DialogActions`, `DialogCloseIconButton`.

`aria-labelledby` and `aria-describedby` are wired automatically by Radix when `DialogTitle` / `DialogDescription` are rendered as descendants. We deliberately don't expose `id` props — that would let consumers accidentally bypass Radix' dev-mode accessibility checks.

### `shared/ui/AlertDialog`
Same idea over `@radix-ui/react-alert-dialog`. Renders `role='alertdialog'` and no overlay-click-to-dismiss by default; `AlertDialogCancel` auto-closes on click. Variants of `AlertDialogHeader` support a leading icon (`iconVariant: 'danger'` for delete).

### `RuleFormModal` migration
- Drop the imperative `<dialog>` + `showModal()` + `cancel` listener (~30 lines of glue removed).
- Keep the dirty-check: `requestClose` runs `window.confirm` when `form.isDirty`, and Radix' `onOpenChange(false)` (overlay click, Escape, X) goes through it.
- The local CSS module is gone — all box styling moved into `shared/ui/Dialog/Dialog.module.css`.

### `DeleteRuleDialog` migration
- Built on `AlertDialog`. The Cancel button uses `<AlertDialogCancel asChild>` so it inherits our `Button` visuals while Radix manages focus/close. Confirm uses `<AlertDialogAction asChild>` and stays interactive while `isPending` so we can render the pending label.
- The local CSS module shrinks to a single `.ruleName` rule for the inline emphasis.

### `RulesTable.test`
The confirmation dialog now uses `role='alertdialog'` (correct semantics). Three assertions are updated:

- `getByRole('dialog')` → `getByRole('alertdialog')` (×2)
- The previously flaky `getByText(/my-rule/)` assertion (which matched both the table cell and the dialog) is now scoped to the description element via `getByText(/about to delete rule/i).toHaveTextContent('my-rule')`. This was the test that already failed on `main`; it now passes.

## Why

Imperative `<dialog>` glue keeps reappearing for every modal we add. Radix gives us:

- Correct focus trap and focus restoration.
- Proper ESC handling and scroll lock.
- ARIA roles and id wiring.
- Vetoable close via `onInteractOutside` / `onEscapeKeyDown`.

We pay ~37 KB of JS for both Dialog primitives. CSS only +0.85 KB. Stays consistent with our existing CSS-Modules + design-tokens approach — Radix ships zero styles.

## Verification

```
npm run typecheck  ok
npm run lint       ok
npm run build      ok (528.56 kB js / 25.10 kB css; +37 kB / +0.85 kB vs PR 1 baseline)
npm test           34/34 pass, no Radix dev-mode warnings
```

## What's next

- PR 3 — TanStack Form + `effect/Schema`, replace `useRuleForm`.
- PR 4 — TanStack Table.
- PR 5 — Radix Tabs in `ServiceDetailPage`, Sonner for toasts.
---

## [PR #46] feat(frontend): PR 3a — Schema-based form validator (effect/Schema)
- **State:** closed
- **Created:** 2026-05-09 | **URL:** https://github.com/SashaFlake/monorepo/pull/46

Stacked on top of #44.

## What

Bridge layer between `effect/Schema` and form libraries:
- `src/shared/form/schemaResolver.ts` — `schemaValidator(schema)` returns `(value) => SchemaValidationError[]`. Uses `errors: 'all'` so the whole form is validated in one pass instead of failing fast.
- `src/features/routing-rules/model/schema.ts` — `RuleFormSchema` describing the routing-rule form invariants (non-blank name, integer priority 0..1000, non-empty destinations, unique versions, weights summing to 100, per-row weight 0..100, non-blank version).

## What this PR does NOT do

- No consumer is wired to the new schema yet. `validation.ts`, `useRuleForm` and `RuleFormModal` keep working exactly as before.
- The cutover (delete `validation.ts` + `useRuleForm` rewrite) lands in PR 3b on top of this branch.

This isolation lets the schema land safely without changing runtime behavior.

## Tests

- `schemaResolver.test.ts` — 6 cases: happy path, single error, error aggregation, missing field, type mismatch, nested path → field mapping.
- `schema.test.ts` — 13 cases mirroring `validation.test.ts` for behavioral parity (name, priority bounds, empty/duplicates/weight-sum on destinations, blank version, all-errors-at-once).

53/53 tests pass, lint + typecheck + build clean.

## Size

~290 lines of hand-written code (under the 300-line limit recently codified in `docs/ui-refresh-plan.md`).

## Plan reference

See `docs/ui-refresh-plan.md` → PR 3a (added in #44).
---

## [PR #47] 35-frontend-TanStack-Table
- **State:** closed
- **Created:** 2026-05-16 | **URL:** https://github.com/SashaFlake/monorepo/pull/47
---

## [PR #48] feat(frontend): PR 5 — Tabs + Toast (Radix Tabs + Sonner)
- **State:** closed
- **Created:** 2026-05-17 | **URL:** https://github.com/SashaFlake/monorepo/pull/48

## Что сделано

Реализован пункт **PR 5 — Tabs + Toast** из `docs/ui-refresh-plan.md`.

---

### shared/ui/Tabs — Radix UI примитив

Новый headless компонент поверх `@radix-ui/react-tabs`:

- **Keyboard navigation из коробки**: ←/→/Home/End, roving tabindex, правильные ARIA roles (`tablist` / `tab` / `tabpanel`).
- Два визуальных варианта через `variant` на `<TabsList>`:
  - `underline` (по умолчанию) — page-level tab bar с border-bottom индикатором.
  - `card` — компактные табы внутри карточки (меньший padding).
- Все стили через CSS Modules + design tokens — Radix не несёт своих стилей.

### ServiceDetailPage — оба таббара на shared Tabs

Заменены два ручных таббара (`useState<PageTab>` + `<button>` + CSS) на `<Tabs>`:

- **Page-level tabs** (Overview / Routing Rules) → `<Tabs defaultValue="overview">` + `<TabsList variant="underline">`.
- **VersionCard tabs** (Manifest / OpenAPI / Instances) → `<Tabs defaultValue="manifest">` + `<TabsList variant="card">`.
- Удалён `useState<VersionTab>` из VersionCard — состояние теперь в Radix.
- Удалён `useState<PageTab>` из ServiceDetailPage.
- CSS классы `.tabBar`, `.tabBtn`, `.versionTabBar`, `.versionTabBtn` больше не используются (можно удалить из CSS в следующем cleanup PR).

### Toast — Sonner

- `<Toaster />` добавлен в `routes/__root.tsx` — один раз для всего приложения.
- Стилизация через `fontFamily: inherit` + `fontSize: var(--text-sm)` + `richColors` (цвета из браузерных CSS variables).
- `useRoutingRulesMutations` — добавлены `toast.success` / `toast.error` для create, update, delete мутаций.

### package.json

- `@radix-ui/react-tabs` добавлен в `dependencies`.
- `sonner` добавлен в `dependencies`.
- `@tanstack/react-table` перемещён из `devDependencies` в `dependencies` (runtime зависимость, не dev).

---

## Размер PR

```
insertions + deletions (без package-lock.json):
- Tabs.tsx          +105
- Tabs.module.css   +63
- shared/ui index   +5
- ServiceDetailPage -48 / +30 (net -18, упрощение)
- __root.tsx        +15
- mutations         +12
- package.json      +4
≈ 234 строки — в рамках лимита ≤ 300
```

## Что выигрываем

- Убраны два ручных `useState` + ручные tab-кнопки из `ServiceDetailPage`.
- Keyboard a11y для табов бесплатно (было: только mouse click).
- Toast-уведомления для всех CRUD операций с правилами.
- Паттерн для будущих табов (OpenApiPanel accordion, etc.) — готов.
---

## [PR #49] feat(frontend): PR 6 — Tooltip (Radix UI)
- **State:** closed
- **Created:** 2026-05-17 | **URL:** https://github.com/SashaFlake/monorepo/pull/49

## Что сделано

Реализован пункт **PR 6 — Tooltip** из `docs/ui-refresh-plan.md` («по требованию»).

---

### shared/ui/Tooltip — Radix UI примитив

Новый headless компонент поверх `@radix-ui/react-tooltip`:

- **Правильный hover + focus** — Radix сам вешает `mouseenter`/`focus` с configurable delay, grace area при движении курсора к тултипу.
- **ARIA из коробки** — `role="tooltip"` + `aria-describedby` на trigger.
- **Collision-aware positioning** через Floating UI — тултип сам уходит от края viewport.
- `TooltipProvider` для глобального `delayDuration` (если нужен в RootLayout).
- `disabled` prop — рендерит children без обёртки.
- Portal — тултип всегда поверх overflow:hidden контейнеров.

**API:**
```tsx
<Tooltip content="Edit rule" side="top">
  <Button variant="ghost">…</Button>
</Tooltip>
```

### Применение

**RulesTable** — Edit/Delete кнопки. Было: только `aria-label`. Стало: `Tooltip` с именем правила + `aria-label` (оба остаются — a11y + UX).

**WeightBar** — сегменты трека. Было: `title="version: X%"` (нативный браузерный тултип, задержка, нет стиля). Стало: `<Tooltip>` с тем же текстом — стилизованный, мгновенный при hover над сегментом.

**StatsGrid** — иконки карточек. Было: иконки без подписей. Стало: Tooltip с описанием что считает каждая метрика. Для «Degraded» — динамический контент с количеством critical.

### package.json

`@radix-ui/react-tooltip ^1.1.8` добавлен в `dependencies`.

---

## Размер PR

```
Tooltip.tsx          +100
Tooltip.module.css   +39
Tooltip/index.ts     +3
shared/ui index      +5
RulesTable.tsx       +14 / -4
WeightBar.tsx        +5 / -4
StatsGrid.tsx        +16 / -4
package.json         +1
≈ 183 строки — в рамках лимита ≤ 300
```

## Что не берём сейчас

- **Select** — поле `version` в DestinationList пока остаётся `<input>`. Select нужен когда появится API для получения версий из реестра (следующий CRUD экран).
- **DropdownMenu** — нет user menu в Sidebar, нет контекстного меню в таблицах. Добавим когда появится конкретная фича.
- **TooltipProvider в root** — не добавляем превентивно. Каждый `<Tooltip>` создаёт свой провайдер, это нормально для текущего масштаба.
---

## [PR #50] 33 frontend validation remove
- **State:** closed
- **Created:** 2026-05-17 | **URL:** https://github.com/SashaFlake/monorepo/pull/50
---
