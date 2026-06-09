# Frontend Action Plan

> Code review проведён агентом 2026-05-04.  
> Стек: React 19 + Vite 6 + TanStack Router + TanStack Query + TypeScript 5.7 + Effect.

---

## 🔴 Критично — сделать сейчас

### 1. Убрать non-null assertions в `useRoutingRules` ✅ Done (2026-06-09)

**Файл:** `src/features/routing-rules/application/useRoutingRules.application.ts`

```ts
// ❌ Сейчас — крэш при вызове вне контекста UI
update: (values) => updateMutation.mutate({ id: editRule!.id, input: values }),
remove: () => deleteMutation.mutate(deleteRule!.id),

// ✅ Заменить на явные guards или Option из effect
update: (values) => {
  if (!editRule) return
  updateMutation.mutate({ id: editRule.id, input: values })
},
remove: () => {
  if (!deleteRule) return
  deleteMutation.mutate(deleteRule.id)
},
```

**Почему важно:** `editRule` и `deleteRule` — nullable state. Вызов `!` без проверки — это潜在ный runtime crash.

---

### 2. Заменить текстовые loading/error состояния на компоненты ✅ Done (2026-06-09)

**Файлы:** `ServicesPage.tsx`, `ServiceDetailPage.tsx`, `RoutingRulesPage.tsx`

- `ServicesPage` — уже использовал `Skeleton` и `ErrorCard`.
- `ServiceDetailPage` — заменены raw `<Card>Loading…</Card>` / `<Card>⚠️ …</Card>` на `Skeleton` + `ErrorCard`.
- `RoutingRulesPage` — аналогично.

---

## 🟡 Структурные улучшения — сделать в ближайший спринт

### 3. Разбить `ServiceDetailPage.tsx` на компоненты ✅ Done (2026-06-09)

**Файл:** `src/features/services/ui/ServiceDetailPage/ServiceDetailPage.tsx` (~61 строка)

Предлагаемая структура:
```
src/features/services/
  components/
    ManifestPanel.tsx
    SpecCard.tsx
    OpenApiPanel.tsx
    InstancesPanel.tsx
    VersionCard.tsx
  ServiceDetailPage.tsx  ← только композиция
```

---

### 4. Добавить runtime-валидацию OpenAPI-ответа ✅ Done (2026-06-09)

**Файл:** `src/features/services/domain/services.dto.ts`

- `OpenApiDocSchema` создан и используется в `lib/http.ts` через `apiFetchEffect(endpoint, OpenApiDocSchema)`.
- `OpenApiPanel` декодирует ответ через `Schema.decodeUnknownSync` / `Schema.is`.

---

### 5. Добавить `index.ts` barrel для фичи `services` ✅ Done (2026-06-09)

**Файл:** `src/features/services/index.ts`

```ts
// src/features/services/index.ts
export { ServicesPage } from './ServicesPage'
export { ServiceDetailPage } from './ServiceDetailPage'
export type { ServiceView, InstanceStatus } from './api/types'
```

Прямые импорты из внутренних путей фичи создают связность — barrel изолирует публичный API модуля.

---

### 6. Разделить `useRoutingRules` на слои ✅ Done (2026-06-09)

**Решение:** UI-состояние модалок перенесено в `store/ui.ts` (Zustand). Server state остаётся в `application/useRoutingRules.application.ts`.

---

## 🟠 FP-first улучшения — следующий итерация

### 7. Декларативный `validateRule` (без `push`) ✅ Done (2026-06-09)

**Файл:** `src/features/routing-rules/domain/routing-rules.types.ts`

- `Destination.create` переписана с `.push()` на декларативный `filter`.
- Domain layer теперь полностью immutable.

---

## 🔵 Архитектурные улучшения — долгосрочно

### 8. Обернуть `apiFetch` в `Effect.tryPromise` ✅ Done (изначально)

**Файл:** `src/lib/http.ts`

- `apiFetchEffect` уже построен на `Effect.tryPromise` + `Schema.decodeUnknown`.
- `apiFetch` — Promise-обёртка для TanStack Query совместимости.
- Type guard `isApiError` переписан через `Schema.is(ApiErrorSchema)` без unsafe `as`.

---

### 9. Проверить конфигурацию local-first персистенции ✅ Done (2026-06-08)

**Файл:** `src/lib/queryClient.ts`, `src/lib/persister.ts`

- `queryClient.ts` импортирует `persister` из `./persister` (без дублирования).
- `persister.ts` имеет `typeof window !== 'undefined'` guard и `noopStorage` fallback для SSR.
- `invalidateQueries` вызывается в `onSuccess` мутаций routing-rules.

---

## Сводная таблица

| # | Файл | Приоритет | Тип | Статус |
|---|------|-----------|-----|--------|
| 1 | `routing-rules/application/useRoutingRules.application.ts` | 🔴 Сейчас | Bug risk | ✅ Done |
| 2 | `services/ui/*`, `routing-rules/ui/*` | 🔴 Сейчас | UX / Defensive UI | ✅ Done |
| 3 | `services/ui/ServiceDetailPage/ServiceDetailPage.tsx` | 🟡 Спринт | Refactor | ✅ Done |
| 4 | `services/domain/services.dto.ts` | 🟡 Спринт | Safety | ✅ Done |
| 5 | `services/index.ts` | 🟡 Спринт | DX | ✅ Done |
| 6 | `store/ui.ts` + `routing-rules/application/useRoutingRules.application.ts` | 🟡 Спринт | Architecture | ✅ Done |
| 7 | `routing-rules/domain/routing-rules.types.ts` | 🟠 Позже | FP-first | ✅ Done |
| 8 | `lib/http.ts` | 🔵 Долго | Architecture | ✅ Done |
| 9 | `lib/queryClient.ts`, `lib/persister.ts` | 🔵 Долго | Local-first | ✅ Done |
