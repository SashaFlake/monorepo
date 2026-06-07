# GitHub Issues #1–#25 — SashaFlake/monorepo
Всего в диапазоне: 25 issues/PRs
---

## [PR #1] feat(auth): migrate auth service from engineer-challenge
- **State:** closed
- **Created:** 2026-04-12 | **URL:** https://github.com/SashaFlake/monorepo/pull/1

## Summary

Migrates the `auth` service from the monorepo `engineer-challenge` into this dedicated backend repository under the `auth/` directory.

## Structure

```
auth/
├── domain/              # Clean Architecture domain layer
│   ├── src/commonMain/  # Models, Commands, Ports, Handlers
│   └── src/commonTest/  # Unit tests (Kotest + MockK)
├── server/              # Ktor server + adapters
│   ├── src/main/kotlin/com/sashaflake/
│   │   ├── Application.kt
│   │   ├── infrastructure/
│   │   │   ├── adapter/      # BCrypt, JWT, InMemory repos, Stub impls
│   │   │   ├── di/           # Koin DI module
│   │   │   ├── graphql/      # GraphQL context factory
│   │   │   ├── metrics/      # Micrometer / Prometheus counters & timers
│   │   │   ├── persistence/  # Dragonfly (Redis) user & token repos
│   │   │   └── plugins/      # Ktor plugins (GraphQL, HTTP, Monitoring, Security, Serialization)
│   │   └── presentation/     # Routing, GraphQL mutations/queries, metrics route
│   ├── src/main/resources/   # application.conf, logback.xml
│   └── src/test/kotlin/      # Integration tests (Ktor testApplication)
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
├── gradlew / gradlew.bat
└── gradle/wrapper/

```

## Key technologies

- **Ktor** (Netty) — HTTP server
- **GraphQL Kotlin** — schema-first GraphQL (mutations: login, register, requestPasswordReset, resetPassword)
- **Koin** — DI
- **Arrow** — typed errors (`Either`)
- **Dragonfly / Redis** (Lettuce) — persistence; falls back to in-memory via `STORAGE_IN_MEMORY=true`
- **Micrometer + Prometheus** — metrics at `/metrics`
- **BCrypt** — password hashing
- **JWT** — token issuance & verification

## Testing

- Domain: pure unit tests with MockK
- Server: integration tests via Ktor `testApplication` (in-memory storage)
---

## [PR #2] feat: migrate to monorepo (add infra/ and frontend/)
- **State:** closed
- **Created:** 2026-04-12 | **URL:** https://github.com/SashaFlake/monorepo/pull/2

## Summary

Превращаем `backend` в монорепо — добавляем `infra/` и `frontend/`.

## Новая структура

```
├── auth/          # Backend: Kotlin/Ktor auth service (было)
├── frontend/      # Frontend (пока placeholder, заполняется отдельным PR)
└── infra/         # Infrastructure (перенесено из SashaFlake/infra)
    ├── Dockerfile
    ├── docker-compose.yaml
    ├── helm/auth-service/
    ├── ops/
    └── terraform/
```

## После merge

1. Переименовать репо: GitHub → Settings → Repository name
2. Заархивировать `SashaFlake/infra` и `SashaFlake/frontend`

## Related
- Closes [SashaFlake/infra#1](https://github.com/SashaFlake/infra/pull/1) (superseded)
- Source: [SashaFlake/engineer-challenge](https://github.com/SashaFlake/engineer-challenge)
---

## [PR #3] feat: add auth service to backend/auth/
- **State:** closed
- **Created:** 2026-04-12 | **URL:** https://github.com/SashaFlake/monorepo/pull/3

## Описание

Переносим auth-сервис из репозитория `engineer-challenge` в `backend/auth/`.

### Что включено

#### Domain (`backend/auth/domain/`)
- Модели: `User`, `Email`, `HashedPassword`, `PlainPassword`, `LoginAttemptGuard`, `PasswordResetToken`
- Команды и хендлеры: `LoginUserHandler`, `RegisterUserHandler`, `RequestPasswordResetHandler`, `ResetPasswordHandler`
- Порты (интерфейсы): `UserRepository`, `PasswordHasher`, `TokenIssuer`, `EmailSender`, `IdGenerator`, `PasswordResetTokenGenerator`, `PasswordResetTokenRepository`
- Unit-тесты для всех хендлеров и моделей

#### Server (`backend/auth/server/`)
- Ktor-приложение с Netty
- GraphQL (graphql-kotlin): мутации `login`, `register`, `requestPasswordReset`, `resetPassword`; query `health`
- Инфраструктурные адаптеры: BCrypt, JWT, Dragonfly (Redis), Stub email sender
- Метрики Micrometer/Prometheus
- DI через Koin
- Интеграционные тесты (Kotest + Ktor test host)

#### Gradle
- `settings.gradle.kts`, `build.gradle.kts`, `gradle.properties` — standalone Gradle-проект с модулями `:domain` и `:server`

### Технологии
- Kotlin 2.3, Ktor 3.4, graphql-kotlin 9, Koin 4, Arrow (Either), Dragonfly/Redis (Lettuce), BCrypt, JWT
---

## [PR #4] feat: add backend service template
- **State:** closed
- **Created:** 2026-04-12 | **URL:** https://github.com/SashaFlake/monorepo/pull/4

## Backend Service Template

Шаблон для создания новых backend-сервисов по архитектуре `auth`-сервиса.

## Что внутри

| Файл | Назначение |
|---|---|
| `template/README.md` | Инструкция по использованию + архитектурные правила |
| `build.gradle.kts`, `settings.gradle.kts`, `gradle.properties` | Готовый Gradle multi-module проект |
| `domain/` | `ExampleId`, `Example`, `CreateExampleCommand`, `CreateExampleHandler`, `ExampleRepository`, `IdGenerator`, unit-тест |
| `server/Application.kt` | Ktor entrypoint с Koin + всеми плагинами |
| `server/infrastructure/adapter/` | `InMemoryExampleRepository` (заглушка), `UuidIdGenerator` |
| `server/infrastructure/di/AppModule.kt` | Koin wire-up |
| `server/infrastructure/graphql/` | `KtorGraphQLContextFactory` с JWT-токеном |
| `server/infrastructure/metrics/ServiceMetrics.kt` | Counter + Timer шаблон |
| `server/infrastructure/plugins/` | GraphQL, HTTP (CORS), Monitoring, Security (JWT), Serialization |
| `server/presentation/graphql/` | `HealthQuery`, `ExampleMutation` |
| `server/presentation/routes/MetricsRoutes.kt` | `/metrics` endpoint |
| `server/src/main/resources/application.conf` | Конфиг Ktor + JWT + Redis |
| `server/src/test/` | Интеграционный тест `ExampleMutationTest` |

## Как создать новый сервис

1. Скопируй `template/` в `backend/{service-name}/`
2. `grep -r '__SERVICE__\|__PACKAGE__\|Example\|example' --include='*.kt' -l | xargs sed -i 's/__SERVICE__/notification/g; s/__PACKAGE__/notification/g; s/Example/Notification/g; s/example/notification/g'`
3. Измени `rootProject.name` в `settings.gradle.kts`
---

## [PR #5] init
- **State:** closed
- **Created:** 2026-04-12 | **URL:** https://github.com/SashaFlake/monorepo/pull/5
---

## [PR #6] auth service removed
- **State:** closed
- **Created:** 2026-04-13 | **URL:** https://github.com/SashaFlake/monorepo/pull/6
---

## [PR #7] Arch
- **State:** closed
- **Created:** 2026-04-15 | **URL:** https://github.com/SashaFlake/monorepo/pull/7
---

## [PR #8] docs: replace SSE device delivery with configurable poll
- **State:** closed
- **Created:** 2026-04-17 | **URL:** https://github.com/SashaFlake/monorepo/pull/8

- Remove SSE for devices, CDS, Redis pub/sub
- Add poll-based command delivery with per-group interval
- SSE remains only for Admin UI real-time dashboard
- Update architecture.md, README.md, sysdes-interview.md
---

## [Issue #9] [Backend] Health агрегация — статус ноды по heartbeat
- **State:** closed | **Labels:** enhancement
- **Created:** 2026-04-25 | **URL:** https://github.com/SashaFlake/monorepo/issues/9

## Описание
Агрегировать статус каждой зарегистрированной ноды на основе heartbeat-сигналов.

## Acceptance Criteria
- [ ] Нода помечается `healthy` если heartbeat приходит в пределах TTL
- [ ] Нода помечается `unhealthy` если heartbeat просрочен, но нода ещё в реестре
- [ ] Нода помечается `dead` и удаляется GC если heartbeat не приходил дольше порога
- [ ] `GET /services/:id/instances` возвращает поле `healthStatus` для каждого инстанса

## Техническое
- Модуль: `backend/service-mesh`
- Слой: `domain/registry`
- FP-first: результат через `Result<T, E>` (neverthrow)

## Связано
- Блокирует: Frontend Dashboard (health overview)
- Зависит от: Service Registry (готов ✅)
---

## [Issue #10] [Backend] Routing Rules — CRUD правил маршрутизации
- **State:** closed | **Labels:** enhancement
- **Created:** 2026-04-25 | **URL:** https://github.com/SashaFlake/monorepo/issues/10

## Описание
Реализовать модуль Routing в Control Plane: CRUD правил маршрутизации с поддержкой weighted routing и canary.

## Acceptance Criteria
- [x] `POST /routes` — создать правило маршрутизации
- [x] `GET /routes` — список всех правил
- [x] `GET /routes/:id` — получить правило
- [x] `PUT /routes/:id` — обновить правило
- [x] `DELETE /routes/:id` — удалить правило
- [x] Валидация через Zod: weights в сумме должны давать 100%
- [x] In-memory хранилище (PostgreSQL позже)

## Техническое
- Модуль: `backend/service-mesh`
- Структура: `domain/routing`, `application/routing`, `presentation/routes`
- FP-first: `Result<T, E>` (neverthrow), pure functions в domain

## Связано
- Блокирует: Config Distribution, Frontend Routes экран, Mock Service пулл
---

## [Issue #11] [Backend] Config Distribution — эндпойнт пулла правил для data plane
- **State:** closed | **Labels:** enhancement
- **Created:** 2026-04-25 | **URL:** https://github.com/SashaFlake/monorepo/issues/11

## Описание
Добавить эндпойнт который data plane нода (мок-сервис) может периодически пуллить актуальные routing rules.

## Acceptance Criteria
- [ ] `GET /config/:serviceId` — возвращает актуальные routing rules для сервиса
- [ ] Ответ содержит версию конфига (для оптимизации пулла на стороне ноды)
- [ ] mock-service может аутентифицироваться по serviceId из Registry
- [ ] Валидация через Zod

## Техническое
- Модуль: `backend/service-mesh`
- Слой: `presentation/config`
- FP-first: `Result<T, E>` (neverthrow)

## Связано
- Зависит от: #10 (Routing Rules)
- Блокирует: Mock Service пулл
---

## [Issue #12] [Backend] Persist — PostgreSQL репозиторий (порт + адаптер)
- **State:** closed | **Labels:** enhancement
- **Created:** 2026-04-25 | **URL:** https://github.com/SashaFlake/monorepo/issues/12

## Описание
Заменить in-memory хранилище на PostgreSQL через паттерн порт + адаптер без изменения domain-логики.

## Acceptance Criteria
- [ ] Интерфейсы `IRegistryRepository` и `IRoutingRepository` определены в domain
- [ ] В `infrastructure/` появились PostgreSQL-адаптеры
- [ ] In-memory адаптеры сохраняются для тестов
- [ ] DI: конкретная реализация подключается через env/config
- [ ] Миграции (Kysely или чистый SQL)

## Техническое
- Модуль: `backend/service-mesh`
- Слой: `infrastructure/persistence`
- Post-MVP: выполнять после закрытия MVP

## Связано
- Зависит от: #10 (Routing Rules), #9 (Health агрегация)
---

## [Issue #13] [Mock] Регистрация в Registry + heartbeat loop
- **State:** closed | **Labels:** enhancement
- **Created:** 2026-04-25 | **URL:** https://github.com/SashaFlake/monorepo/issues/13

## Описание
При старте mock-service автоматически регистрируется в Control Plane Registry и запускает периодический heartbeat.

## Acceptance Criteria
- [ ] При старте: `POST /services/:id/instances` на Control Plane с передачей host/port
- [ ] Heartbeat loop: `PUT /services/:id/instances/:instanceId/heartbeat` каждые N секунд
- [ ] При штатном завершении (SIGTERM): deregister инстанса
- [ ] Конфигурация через env: `CONTROL_PLANE_URL`, `SERVICE_NAME`, `SERVICE_PORT`

## Техническое
- Модуль: `backend/mock-service`
- FP-first: пурые функции для бизнес-логики, `Result<T, E>` для ошибок

## Связано
- Зависит от: Service Registry (готов ✅), #9 (Health агрегация)
- Блокирует: #14 (пулл routing rules)
---

## [Issue #14] [Mock] Периодический пулл routing rules + применение (weighted round-robin)
- **State:** closed | **Labels:** enhancement
- **Created:** 2026-04-25 | **URL:** https://github.com/SashaFlake/monorepo/issues/14

## Описание
mock-service периодически пуллит routing rules у Control Plane и применяет их при проксировании входящих запросов.

## Acceptance Criteria
- [ ] Периодический `GET /config/:serviceId` на Control Plane (настраиваемый интервал)
- [ ] Семантика версий: перезагрузка правил только если версия изменилась
- [ ] Weighted round-robin при проксировании запросов на upstream-сервисы
- [ ] Логирование: какой upstream был выбран для каждого запроса

## Техническое
- Модуль: `backend/mock-service`
- Алгоритм weighted round-robin: пурая функция, не мутирует состояние
- FP-first: `Result<T, E>` (neverthrow)

## Связано
- Зависит от: #13 (регистрация), #11 (Config Distribution)
---

## [Issue #15] [Backend] Health агрегация — статус ноды по heartbeat
- **State:** closed | **Labels:** enhancement
- **Created:** 2026-04-25 | **URL:** https://github.com/SashaFlake/monorepo/issues/15

## Описание
Реализовать агрегацию health-статуса data plane нод на основе heartbeat-сигналов.

## Критерии готовности
- [ ] Нода считается `healthy` если heartbeat приходил не позже N секунд назад
- [ ] Нода переходит в `unhealthy` при пропуске heartbeat
- [ ] Нода переходит в `dead` при долгом отсутствии heartbeat (GC)
- [ ] Статус доступен через Registry API
- [ ] Покрыто unit-тестами

## Стек
- Fastify v5 + TypeScript
- FP-first: `Result<T,E>` через neverthrow, без исключений
- Слой: `domain / application / presentation`
---

## [Issue #16] [Backend] Routing Rules — CRUD правил маршрутизации
- **State:** closed | **Labels:** enhancement
- **Created:** 2026-04-25 | **URL:** https://github.com/SashaFlake/monorepo/issues/16

## Описание
Реализовать CRUD для правил маршрутизации: weighted routing, canary deployments.

## Эндпоинты
```
GET    /routes          — список правил
POST   /routes          — создать правило
GET    /routes/:id      — получить правило
PUT    /routes/:id      — обновить правило
DELETE /routes/:id      — удалить правило
```

## Критерии готовности
- [ ] Доменная модель `RoutingRule` с валидацией через Zod
- [ ] In-memory репозиторий (интерфейс порта)
- [ ] Fastify-руты для всех 5 операций
- [ ] Валидация: сумма weights = 100%
- [ ] Покрыто unit + integration тестами

## Стек
- Fastify v5 + TypeScript + Zod
- FP-first: `Result<T,E>` через neverthrow
- Архитектура: `domain / application / presentation`
---

## [Issue #17] [Backend] Config Distribution — эндпоинт пулла правил для data plane
- **State:** closed | **Labels:** enhancement
- **Created:** 2026-04-25 | **URL:** https://github.com/SashaFlake/monorepo/issues/17

Дубликат #11. Закрыто.
---

## [Issue #18] [Backend] Persist — PostgreSQL репозиторий (порт + адаптер)
- **State:** closed | **Labels:** enhancement
- **Created:** 2026-04-25 | **URL:** https://github.com/SashaFlake/monorepo/issues/18

## ~~Persist — PostgreSQL репозиторий (порт + адаптер)~~

> **Исключено из скоупа.** In-memory реализация достаточна для MVP. PostgreSQL добавим позже отдельной веткой.

См. README: _«PostgreSQL persist — За скоупом MVP»_
---

## [Issue #19] [Frontend] Service Registry Dashboard — список сервисов и health-статус
- **State:** closed | **Labels:** enhancement
- **Created:** 2026-04-25 | **URL:** https://github.com/SashaFlake/monorepo/issues/19

## Описание
React-страница с real-time отображением зарегистрированных сервисов и их health-статуса.

## Acceptance Criteria
- [ ] Таблица/список всех сервисов из `GET /api/v1/services`
- [ ] Health-статус каждого инстанса: `healthy` / `unhealthy` / `dead` с цветовой индикацией
- [ ] Периодический polling или SSE для обновления без перезагрузки страницы
- [ ] Отображение: serviceName, host:port, instanceId, lastHeartbeat

## Стек
- React + TypeScript
- Local-first подход
- FP-first: чистые функции для трансформации данных

## Зависимости
- Зависит от: Service Registry (готов ✅)
- Блокирует: #[Routing Rules UI]
---

## [Issue #20] [Frontend] Routing Rules UI — CRUD правил маршрутизации
- **State:** closed | **Labels:** enhancement
- **Created:** 2026-04-25 | **URL:** https://github.com/SashaFlake/monorepo/issues/20

## Описание
Интерфейс для управления Routing Rules: создание, редактирование, удаление правил.

## Acceptance Criteria
- [ ] Список раутинг-правил из `GET /routes`
- [ ] Форма создания/редактирования правила с валидацией: сумма weights = 100%
- [ ] Удаление правила с подтверждением
- [ ] Визуальное отображение upstream-сервисов и их weights (прогресс-бар или таблица)

## Стек
- React + TypeScript
- FP-first: чистые функции для валидации и трансформации

## Зависимости
- Зависит от: #10 (Routing Rules CRUD backend)
- Зависит от: #19 (Registry Dashboard)
---

## [Issue #21] [Infra] k3s деплой на Cloud.ru — service-mesh Control Plane + mock-service
- **State:** closed | **Labels:** enhancement
- **Created:** 2026-04-25 | **URL:** https://github.com/SashaFlake/monorepo/issues/21

## Описание
Развернуть Control Plane (`backend/service-mesh`) и два инстанса mock-service в k3s-кластере на Cloud.ru (1 master + 1 worker).

## Acceptance Criteria
- [ ] Helm-чарт или k8s Deployment/Service манифесты для `service-mesh` и `mock-service`
- [ ] ConfigMap/Secrets через env
- [ ] Ingress (Traefik, встроен в k3s) для Control Plane API
- [ ] Два инстанса mock-service регистрируются в Registry и шлют heartbeat
- [ ] Скрипт или GitHub Action для деплоя

## Конфиг
- k3s: 1 master node + 1 worker node (Cloud.ru)
- Инфраструктура в `service-mesh/infra/`

## Зависимости
- Зависит от: #13 (mock-service регистрация + heartbeat)
- Зависит от: #14 (mock-service routing rules пулл)
---

## [PR #22] 10 backend routing rules crud
- **State:** closed
- **Created:** 2026-04-26 | **URL:** https://github.com/SashaFlake/monorepo/pull/22
---

## [PR #23] Service mesh
- **State:** closed
- **Created:** 2026-04-26 | **URL:** https://github.com/SashaFlake/monorepo/pull/23
---

## [PR #24] 20 frontend routing rules UI
- **State:** closed
- **Created:** 2026-04-27 | **URL:** https://github.com/SashaFlake/monorepo/pull/24
---

## [PR #25] Frontend tech debt styles fix
- **State:** closed
- **Created:** 2026-04-27 | **URL:** https://github.com/SashaFlake/monorepo/pull/25
---
