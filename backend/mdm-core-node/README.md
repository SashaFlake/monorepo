# mdm-core-node

Node.js / TypeScript реализация MDM Core сервиса.  
Архитектура: **Clean Architecture + DDD** (команды, порты, адаптеры).

## Стек

| Роль | Библиотека |
|---|---|
| HTTP-фреймворк | [Fastify v5](https://fastify.dev) |
| Язык | TypeScript 5, NodeNext modules |
| DI-контейнер | [tsyringe](https://github.com/microsoft/tsyringe) |
| Result-type | [neverthrow](https://github.com/supermacro/neverthrow) |
| ORM | [Prisma](https://www.prisma.io) |
| Валидация | [Zod](https://zod.dev) |
| Тесты | [Vitest](https://vitest.dev) |
| Linter/Formatter | [Biome](https://biomejs.dev) |

## Быстрый старт

```bash
bash scaffold.sh        # первый запуск — создаёт структуру и ставит зависимости
cp .env.example .env    # заполни DATABASE_URL и JWT_SECRET
pnpm db:generate        # сгенерировать Prisma client
pnpm db:migrate         # применить миграции
pnpm dev                # запустить в dev-режиме (hot-reload)
```

## Структура

```
src/
├── domain/                 # Чистая бизнес-логика — ноль фреймворков
│   ├── model/              # Entities, Value Objects
│   ├── command/            # Интерфейсы команд и хендлеров
│   ├── port/               # Интерфейсы репозиториев и внешних сервисов
│   ├── event/              # Domain events
│   └── error/              # DomainError type
│
├── application/            # Оркестрация use-cases
│   ├── command-handler/    # CommandBus + конкретные хендлеры
│   ├── query-handler/      # CQRS query side
│   └── service/            # Application services
│
├── infrastructure/         # Реализации портов
│   ├── adapter/            # Адаптеры внешних API / очередей
│   ├── persistence/prisma/ # Prisma репозитории
│   ├── messaging/          # Брокеры (Redis / RabbitMQ / Kafka)
│   └── http/client/        # HTTP-клиенты внешних сервисов
│
├── presentation/           # Delivery layer
│   ├── routes/             # Fastify route plugins
│   ├── middleware/         # Auth, logging, rate-limit hooks
│   └── schema/             # Zod схемы запросов/ответов
│
├── container/              # Composition root (tsyringe)
├── config/                 # Env validation (Zod)
└── main.ts                 # Entry point
```

## Архитектурные правила

- **`domain/`** — нет зависимостей на Fastify / Prisma / tsyringe. Только `neverthrow` и стандартные модули Node.
- **Порты** — интерфейсы в `domain/port/`, реализации в `infrastructure/adapter/`.
- **Хендлеры** возвращают `Result<T, DomainError>` — никаких `throw` для бизнес-ошибок.
- **DI** — вся сборка в `src/container/index.ts`. Нигде больше `new` для сервисов.
- **Каждая операция** — counter (attempt / success / failure) в `presentation/middleware/metrics.ts`.
