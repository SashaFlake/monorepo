# UI Refresh Plan — Service Mesh Frontend

> Цель: перестать писать каждый компонент с нуля, не теряя принципов DDD / FP / local-first / контроля сайд-эффектов.

---

## TL;DR

Поставить **headless‑first** стек:

1. **Radix UI Primitives** — поведение и a11y для Dialog, DropdownMenu, Select, Tabs, Tooltip, Popover, Toast, Switch, Checkbox, RadioGroup, Slider. **Без стилей** — все стили остаются на ваших CSS Modules + design tokens из `index.css`.
2. **TanStack Table** — таблицы (RulesTable, ServicesTable, InstancesTable). Headless, чистые редьюсеры состояния, идеально ложится на FP.
3. **TanStack Form + @effect/schema** — формы. Schema = единый источник правды и для UI, и для домена. Полностью убирает ручной `useRuleForm` boilerplate.
4. **Sonner** — toast‑уведомления (не headless, но 8 KB, минимально стилизуется через CSS variables, единственное «готовое» исключение).
5. **clsx + tailwind‑merge** уже не нужны — оставляем `clsx`, который у вас есть.
6. **`@react-aria` опционально** — если Radix чего‑то не даёт (Combobox, NumberField). React Aria тоже headless.

Что **НЕ** берём и почему:

- ❌ **shadcn/ui** — это копипаста Radix + Tailwind. Заставит мигрировать весь CSS на Tailwind, а ваш design system на CSS variables уже работает.
- ❌ **MUI / Chakra / Mantine** — стилизованные «коробки». Тащат свой рантайм темизации, конфликтуют с вашими токенами, противоречат local‑first духу (тяжёлый bundle).
- ❌ **Ant Design** — корпоративный look, тяжёлый, плохо темизуется.
- ❌ **Tailwind** прямо сейчас — миграция 1300+ строк CSS Modules не даст профита. У вас уже есть design tokens; CSS Modules + tokens = тот же результат при меньшей миграции.
- ❌ **Zod на фронте** — у вас уже Effect. Брать `@effect/schema` (теперь `effect/Schema`), он бесшовно работает с `Either`/`Option`, которые вы уже используете в `validation.ts` и `useRuleForm`.

---

## Что не так сейчас (без обвинений — просто диагноз)

Я прошёл по `service-mesh/frontend/service-mesh/src` (~4260 строк, ~70 файлов). Самые «дорогие» места:

| Компонент / зона | Строк | Что делает руками | Можно отдать библиотеке |
|---|---:|---|---|
| `RuleFormModal.tsx` + `RuleFormModal.module.css` | 160 | `<dialog>` + ручной `cancel`/overlay/`showModal()`, `requestClose`, ESC, focus trap | **Radix Dialog** — всё это из коробки + правильный focus trap |
| `DeleteRuleDialog.tsx` + css | 90 | overlay + `stopPropagation` + ARIA вручную | **Radix AlertDialog** |
| `RulesTable.tsx` + css | ~200 | строка‑чип для destinations, sort/filter — позже | **TanStack Table** + ваши `<td>` стили |
| `DestinationList.tsx` | 75 | inputs + remove button + sum check | оставить как есть, чисто доменный, но `<input>` обернуть в общий `<TextField>` примитив |
| `useRuleForm.ts` + `validation.ts` | 170 | ручной dirty tracking, errorMap, submitAttempted, Effect.Either | **TanStack Form** + `effect/Schema`. Минус ~120 строк, плюс единая схема |
| `Sidebar.tsx` (+ потом, dropdown menu) | 64 | пока ок | при добавлении user menu — **Radix DropdownMenu** |
| `OpenApiPanel.tsx` | 116 | tabs/accordion в перспективе | **Radix Tabs** + **Radix Accordion** |
| `ServiceDetailPage.tsx` | 264 | тоже tabs внутри (Manifest / OpenAPI / Instances) | **Radix Tabs** |

**Главная проблема — отсутствие примитивов.** Каждый раз когда нужен Dialog/Tabs/Select — пишется свой. Это и съедает время.

**Второй фактор** — формы написаны на чистом `useState` + ручной dirty/error tracking. Это красиво один раз (в `useRuleForm`), но к 5‑й форме станет копипастой.

---

## Архитектура «после»

```
src/
├─ shared/
│  ├─ ui/                     ← примитивы: тонкие обёртки над Radix + ваши CSS Modules
│  │  ├─ Dialog/              (Radix Dialog + Dialog.module.css)
│  │  ├─ AlertDialog/         (Radix AlertDialog)
│  │  ├─ DropdownMenu/        (Radix DropdownMenu)
│  │  ├─ Select/              (Radix Select)
│  │  ├─ Tabs/                (Radix Tabs)
│  │  ├─ Tooltip/             (Radix Tooltip)
│  │  ├─ Toast/               (Sonner re-export + theme)
│  │  ├─ TextField/           (input + label + error, на будущее — React Aria NumberField)
│  │  ├─ Button/              ← остаётся ваш
│  │  ├─ Badge/               ← остаётся ваш
│  │  ├─ Card/                ← остаётся ваш
│  │  └─ index.ts             (barrel)
│  ├─ form/
│  │  ├─ createForm.ts        (фабрика TanStack Form, привязанная к effect/Schema)
│  │  └─ schemaResolver.ts    (мост effect/Schema → TanStack Form validators)
│  └─ table/
│     └─ DataTable.tsx        (тонкая обёртка над TanStack Table — column defs + ваш <table> CSS)
│
├─ features/
│  ├─ routing-rules/
│  │  ├─ domain/              ← переименовать model/ → domain/ (DDD-слой)
│  │  │  ├─ schema.ts         ← effect/Schema, источник правды
│  │  │  ├─ types.ts          ← Schema.Type<typeof RoutingRuleSchema>
│  │  │  └─ rules.ts          ← чистые функции: sumWeights, validateWeights и т.п.
│  │  ├─ application/         ← use cases (useRoutingRules, mutations) — было model/
│  │  ├─ infrastructure/      ← api/api.ts (HTTP) + api/mock.ts + persistence (idb-keyval)
│  │  └─ ui/                  ← компоненты, было components/
│  └─ services/ (та же раскладка)
└─ components/                ← удалить, всё разъехалось по shared/ui и features/*/ui
```

**DDD‑соответствие:**
- `domain/` — чистый, без React, без сетевых вызовов. Effect.Either, Schema, value objects.
- `application/` — хуки‑оркестраторы (React Query + Zustand). Сайд‑эффекты только тут.
- `infrastructure/` — API клиенты и local‑first persistence (idb‑keyval, persistQueryClient).
- `ui/` — глупые компоненты, читают props, эмитят события.

**FP‑соответствие:** все валидаторы и редьюсеры остаются чистыми; библиотеки — headless и не приносят свой imperative state.

**Local‑first соответствие:** Radix/TanStack — рантайм 0 KB сетевой активности; persistQueryClient + idb‑keyval (уже подключено) продолжают работать. Sonner работает офлайн.

**Контроль сайд‑эффектов:** Effect остаётся базой. TanStack Query — единственный «легитимный» источник эффектов на UI‑слое; всё остальное (валидация, форма, таблица) — чистые редьюсеры.

---

## Зависимости

```bash
pnpm add @radix-ui/react-dialog \
         @radix-ui/react-alert-dialog \
         @radix-ui/react-dropdown-menu \
         @radix-ui/react-select \
         @radix-ui/react-tabs \
         @radix-ui/react-tooltip \
         @radix-ui/react-popover \
         @radix-ui/react-switch \
         @radix-ui/react-checkbox \
         @tanstack/react-table \
         @tanstack/react-form \
         sonner

# Effect Schema у вас в effect@3 уже есть как `effect/Schema` —
# отдельный пакет НЕ нужен.
```

Bundle impact (примерно, gzip):
- Radix‑примитив ≈ 3–8 KB каждый, tree‑shakeable, ставите только используемые.
- TanStack Table v8 ≈ 14 KB.
- TanStack Form v0.x ≈ 8 KB.
- Sonner ≈ 4 KB.
- **Итого ~50 KB gzip** для всего, что закроет 95 % UI‑потребностей дашборда.

---

## Пошаговый план миграции (мелкие PR — как требует ваш space)

### Лимит размера PR

Правило, зафиксированное после ретро по PR #44 / #45:

- **≤ 300 строк ручного кода на PR** (insertions + deletions без `package-lock.json`, без сгенерированных файлов вроде `routeTree.gen.ts`, без чисто документационных markdown-файлов).
- Если изменение крупнее — режем на stacked PR (`base` друг на друга), каждый ревьюится изолированно.
- Lockfile коммитится тем же PR, что и зависимости, чтобы CI работал — но в счёт строк не идёт.
- Для оценки: `gh pr view N --json files -q '.files[] | "\(.additions)+\(.deletions)-\t\(.path)"' | sort -rn`.

### PR 1 — Чистка и фундамент (2–3 часа)

- [ ] Удалить дубли регистра имён: оставить либо `Button.tsx`/`Card.tsx`/`Badge.tsx` (PascalCase), либо `button.tsx`/… В коде сейчас импортируется lowercase — оставляем lowercase, переименование оставляем на потом.
- [ ] Создать структуру `src/shared/ui/`, `src/shared/form/`, `src/shared/table/`.
- [ ] Перенести `components/ui/{button,card,badge,Skeleton,ErrorCard}` → `shared/ui/`.
- [ ] Алиас `@/shared/*` в `vite.config.ts` и `tsconfig.app.json`.

### PR 2 — Radix Dialog + AlertDialog (2 часа)

- [ ] Установить `@radix-ui/react-dialog`, `@radix-ui/react-alert-dialog`.
- [ ] Сделать `shared/ui/Dialog/Dialog.tsx` — тонкую обёртку, проксирующую Radix `Trigger/Content/Title/Description/Close` в ваши CSS Modules.
- [ ] Переписать `RuleFormModal` поверх `<Dialog>`. Удалить ручные `useRef<HTMLDialogElement>`, `showModal()`, `cancel` listener. **Сохранить** `requestClose` с dirty‑check (Radix `onOpenChange` это поддерживает).
- [ ] Переписать `DeleteRuleDialog` поверх `<AlertDialog>` (он уже семантически корректен — даёт `role="alertdialog"`).
- [ ] Тест `RulesTable.test.tsx` — проверить, что Radix Dialog рендерится через portal: добавить `screen.findByRole('dialog')`.

**Что выигрываем:** −80 строк ручного кода + правильный focus trap + ESC/overlay из коробки + a11y без правок.

### PR 3 — TanStack Form + effect/Schema

Разбит на 3 stacked PR (каждый ≤ 300 строк):

#### PR 3a — `shared/form/schemaResolver` + Schema-описание правила (≈ 1 час)

- [ ] Создать `shared/form/schemaResolver.ts`:
  ```ts
  import { Schema, ParseResult, Either } from 'effect'

  export const schemaValidator = <A, I>(schema: Schema.Schema<A, I>) =>
    (value: I) => {
      const result = Schema.decodeUnknownEither(schema)(value)
      return Either.isLeft(result)
        ? ParseResult.TreeFormatter.formatErrorSync(result.left)
        : undefined
    }
  ```
- [ ] Юнит-тесты резолвера (happy path + 2-3 case'а с ошибками).
- [ ] В `features/routing-rules/model/schema.ts` (пока ещё `model/`) описать `RoutingRuleSchema` через `Schema.Struct` с `Schema.filter` для priority/weights/duplicates. Старый `validation.ts` пока живёт параллельно — его не трогаем.

Выхлоп: новый файл + тесты, нигде не используется. Безопасно ревьюить отдельно.

#### PR 3b — `useRuleForm` на TanStack Form (≈ 1.5 часа)

- [ ] Установить `@tanstack/react-form`.
- [ ] Перевести `useRuleForm` на `useForm` из TanStack Form, валидатор — `schemaValidator(RoutingRuleSchema)`.
- [ ] Удалить старый `useRuleForm.ts` и `validation.ts` (логика ушла в Schema).
- [ ] Field-компоненты `RuleNameField` / `RuleMatchFields` принимают `field` API вместо props-дрилла.
- [ ] Обновить тесты `RuleFormModal` / `DestinationList`.

Выхлоп: −120 строк ручного кода, dirty/touched/errors из коробки, нет ручного `submitAttempted`.

#### PR 3c — Переименование `model/` → `domain/` (≈ 30 минут)

- [ ] `git mv features/routing-rules/model features/routing-rules/domain`.
- [ ] Обновить импорты (`from '../../model/...'` → `from '../../domain/...'`).
- [ ] Подровнять под DDD-таргет (`feature/{domain,application,infrastructure,ui}/`).

Выхлоп: чистый rename-PR, нулевой риск, легко ревьюится.

### PR 4 — TanStack Table (2 часа)

- [ ] `shared/table/DataTable.tsx` — обёртка, принимает `columns: ColumnDef<T>[]` + `data: T[]` + опции, рендерит ваш `<table>` со существующими CSS Modules (`RulesTable.module.css`).
- [ ] Переписать `RulesTable` — оставить визуал, но `useReactTable({ ... })` для column defs, sortability готов на следующий шаг.
- [ ] Переписать `ServicesTable` тем же путём. Дальше — фильтры/пагинация почти бесплатно.

**Что выигрываем:** возможность за вечер добавить sort, filter, pagination, virtual scrolling, ничего не переписывая.

### PR 5 — Tabs + Toast (1.5 часа)

- [ ] `shared/ui/Tabs/Tabs.tsx` — обёртка над `@radix-ui/react-tabs`. Переписать `ServiceDetailPage` — текущая «верстка‑своими‑руками» переключения панелей (Manifest / OpenAPI / Instances) уйдёт в `<Tabs>`.
- [ ] Подключить `<Toaster />` от `sonner` в `routes/__root.tsx`. В `useRoutingRulesMutations` заменить (если есть) ручные success/error баннеры на `toast.success(...)` / `toast.error(...)`. Стили — через `--normal-bg`/`--normal-text` CSS variables, мапятся на ваши.

### PR 6 — Select / DropdownMenu / Tooltip по мере появления (по требованию)

Делаем не превентивно. Когда понадобится в фиче — добавляем примитив в `shared/ui` и пользуемся.

---

## Почему именно Radix, а не альтернативы

| Критерий | Radix | React Aria | Headless UI | Ark UI |
|---|---|---|---|---|
| Tree‑shake по примитивам | ✅ | ✅ | ✅ | ✅ |
| Покрытие компонентов | 25+ | 30+ | 10 | 25+ |
| TypeScript типы | отлично | отлично | хорошо | отлично |
| Server Components ready | да | да | частично | да |
| Размер ядра / примитива | 3–8 KB | 5–10 KB | 2–5 KB | 4–8 KB |
| Зрелость / шаблоны | макс. | макс. | средняя | растёт |
| Совместимость с CSS Modules | ✅ | ✅ | ✅ | ✅ |

Radix — самый «mainstream», у него больше всего примеров, его использует shadcn, vercel, linear. **React Aria** — берём точечно, только если Radix не покрывает (Combobox/NumberField).

---

## Чего я бы НЕ менял

1. **Effect** — оставить как есть. Effect Schema полностью заменит ручной валидатор.
2. **Zustand** для UI‑state — отлично, не трогать.
3. **TanStack Query + persister + idb‑keyval** — образцово настроено для local‑first, не трогать.
4. **TanStack Router** — без замечаний.
5. **CSS Modules + design tokens в `index.css`** — это ваш design system, он работает. Tailwind нужен только если хочется писать классы инлайн; цена миграции выше выигрыша.
6. **`Button` / `Card` / `Badge`** — простые, домашние, продолжают жить. Зачем брать что‑то снаружи для 20 строк JSX.

---

## Потенциальные риски

- **Radix Portal + jsdom** в тестах — нужно `await screen.findByRole('dialog')`, а не `getBy*` сразу после клика. Поправить пару тестов.
- **Effect Schema parser** в горячем коде формы — пересоздаётся на каждый рендер. Нужно `useMemo` для `Schema.decodeUnknownEither(schema)`.
- **TanStack Form v1** релиз свежий — придерживаться minor‑версии до выхода 1.0 LTS, если хочется стабильности; либо `react-hook-form` + `@effect/schema` resolver. RHF проще, но менее «functional» — выбор за вами; я бы взял TanStack Form за консистентность стека.

---

## Критерий успеха

Через 2 недели на фичу «новый CRUD‑экран» (например, Policies) уходит **≤ 1 дня вместо 3**, потому что:
- Dialog, Table, Form, Toast — готовы.
- Schema один раз пишется в `domain/`, дальше форма + типы + API‑validator из неё выводятся.
- Стиль и a11y бесплатны и единообразны.
