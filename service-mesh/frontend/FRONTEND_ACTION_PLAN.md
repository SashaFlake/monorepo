# Frontend Action Plan

> Code review проведён агентом 2026-05-04.  
> Стек: React 19 + Vite 6 + TanStack Router + TanStack Query + Tailwind 4 + TypeScript 5.7 + Effect.

---

## 🔴 Критично — сделать сейчас

### 1. Убрать non-null assertions в `useRoutingRules`

**Файл:** `src/features/routing-rules/model/useRoutingRules.ts`

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

### 2. Заменить текстовые loading/error состояния на компоненты

**Файл:** `src/features/services/ServicesPage.tsx`, `ServiceDetailPage.tsx`

```tsx
// ❌ Сейчас
{isLoading && <Card>Loading…</Card>}
{isError && <Card>⚠️ Cannot reach registry backend</Card>}

// ✅ Добавить компоненты:
// src/components/ui/Skeleton.tsx — shimmer-анимация под структуру таблицы
// src/components/ui/ErrorCard.tsx — иконка + сообщение + кнопка retry
```

Pseudo-код скелетона:
```tsx
<div className="skeleton skeleton-text" style={{ width: '60%' }} />
<div className="skeleton skeleton-text" style={{ width: '80%' }} />
```

---

## 🟡 Структурные улучшения — сделать в ближайший спринт

### 3. Разбить `ServiceDetailPage.tsx` на компоненты

**Файл:** `src/features/services/ServiceDetailPage.tsx` (~270 строк, всё в одном файле)

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

### 4. Добавить runtime-валидацию OpenAPI-ответа

**Файл:** `src/features/services/ServiceDetailPage.tsx`

```ts
// ❌ Сейчас — небезопасный cast
const doc = data as OpenApiDoc

// ✅ Использовать Zod или effect/Schema
import { Schema } from 'effect'
const OpenApiDocSchema = Schema.Struct({ ... })
const doc = Schema.decodeUnknownSync(OpenApiDocSchema)(data)
```

OpenAPI-ответ приходит от произвольных сервисов — его форма не гарантирована.

---

### 5. Добавить `index.ts` barrel для фичи `services`

**Отсутствует:** `src/features/services/index.ts`  
**Есть у:** `src/features/routing-rules/index.ts` ✅

```ts
// src/features/services/index.ts
export { ServicesPage } from './ServicesPage'
export { ServiceDetailPage } from './ServiceDetailPage'
export type { ServiceView, InstanceStatus } from './api/types'
```

Прямые импорты из внутренних путей фичи создают связность — barrel изолирует публичный API модуля.

---

### 6. Разделить `useRoutingRules` на слои

**Проблема:** хук смешивает UI-состояние (modal open/close) и server state (mutations).  
Это затрудняет изолированное тестирование бизнес-логики.

```
// ✅ Разбить:
useRoutingRulesMutations(serviceId)  ← только TanStack Query mutations
useRoutingRulesUI()                  ← только useState для модалок
```

Компонент комбинирует оба хука самостоятельно.

---

## 🟠 FP-first улучшения — следующий итерация

### 7. Декларативный `validateRule` (без `push`)

**Файл:** `src/features/routing-rules/model/validation.ts`

```ts
// ❌ Сейчас — императивный аккумулятор
const errors: ValidationError[] = []
errors.push(...)

// ✅ FP-стиль — declarative pipeline
import { pipe, Array as A } from 'effect'

const validateRule = (values: RuleFormValues): ValidationResult<RuleFormValues> => {
  const errors = [
    !values.name.trim()                  && { field: 'name',         message: 'Name is required' },
    (values.priority < 0 || values.priority > 1000) && { field: 'priority', message: 'Priority must be 0–1000' },
    values.destinations.length === 0     && { field: 'destinations', message: 'Add at least one destination' },
  ].filter((e): e is ValidationError => Boolean(e))

  return errors.length > 0 ? Either.left(errors) : Either.right(values)
}
```

---

## 🔵 Архитектурные улучшения — долгосрочно

### 8. Обернуть `apiFetch` в `Effect.tryPromise`

**Файл:** `src/lib/http.ts`

```ts
// ✅ Typed errors, retry, structured concurrency
import { Effect } from 'effect'

export const apiFetch = <T>(path: string, init?: RequestInit) =>
  Effect.tryPromise({
    try: async () => {
      const res = await fetch(`${BASE}${path}`, init)
      if (!res.ok) throw new ApiError(res.status, res.statusText, path)
      return res.json() as Promise<T>
    },
    catch: (e) => e instanceof ApiError ? e : new ApiError(0, String(e), path),
  })
```

Это позволяет выражать retry-политики, таймауты и typed error handling через `Effect.retry`, `Effect.timeout`.

---

### 9. Проверить конфигурацию local-first персистенции

**Файл:** `src/lib/queryClient.ts`

- `gcTime` должен быть **больше** `staleTime` — иначе данные вытесняются из кэша до записи в IDB
- Убедиться, что `persistQueryClient` вызывается с правильным `persister` на основе `idb-keyval`
- Мутации, меняющие server state, должны вызывать `invalidateQueries` в `onSettled`, а не только `onSuccess`

---

## Сводная таблица

| # | Файл | Приоритет | Тип |
|---|------|-----------|-----|
| 1 | `routing-rules/model/useRoutingRules.ts` | 🔴 Сейчас | Bug risk |
| 2 | `services/ServicesPage.tsx`, `ServiceDetailPage.tsx` | 🔴 Сейчас | UX / Defensive UI |
| 3 | `services/ServiceDetailPage.tsx` | 🟡 Спринт | Refactor |
| 4 | `services/ServiceDetailPage.tsx` | 🟡 Спринт | Safety |
| 5 | `services/index.ts` (создать) | 🟡 Спринт | DX |
| 6 | `routing-rules/model/useRoutingRules.ts` | 🟡 Спринт | Architecture |
| 7 | `routing-rules/model/validation.ts` | 🟠 Позже | FP-first |
| 8 | `lib/http.ts` | 🔵 Долго | Architecture |
| 9 | `lib/queryClient.ts` | 🔵 Долго | Local-first |
