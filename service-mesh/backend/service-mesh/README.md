# service-mesh — backend

Control plane backend. Модульный монолит на Fastify + TypeScript.

## Стек

| Роль | Библиотека |
|---|---|
| HTTP | Fastify v5 |
| Валидация | Zod |
| Result type | neverthrow |
| Runtime | tsx (dev), Node 20+ |

## Быстрый старт

```bash
cd backend/service-mesh
npm install
cp .env.example .env
npm run dev
```

Сервер поднимется на `http://localhost:4000`.

## API — Registry

| Method | Path | Описание |
|---|---|---|
| `POST` | `/api/v1/services` | Зарегистрировать инстанс |
| `PUT` | `/api/v1/instances/:id/heartbeat` | Продлить TTL |
| `DELETE` | `/api/v1/instances/:id` | Дерегистрировать |
| `GET` | `/api/v1/services` | Список всех сервисов |
| `GET` | `/api/v1/services/:name` | Инстансы сервиса |
| `GET` | `/health` | Health check |

### Пример

```bash
# Регистрация
curl -X POST http://localhost:4000/api/v1/services \
  -H 'Content-Type: application/json' \
  -d '{"serviceName":"auth-service","host":"10.0.0.1","port":3001}'
# → { "instanceId": "<uuid>" }

# Heartbeat
curl -X PUT http://localhost:4000/api/v1/instances/<uuid>/heartbeat

# Lookup
curl http://localhost:4000/api/v1/services/auth-service

# Список всех
curl http://localhost:4000/api/v1/services
```

## Структура

```
src/
├── config/env.ts                        # Zod env validation
├── modules/
│   └── registry/
│       ├── domain/
│       │   ├── model.ts                 # ServiceInstance, InstanceStatus, toView
│       │   └── errors.ts                # RegistryError type
│       ├── application/
│       │   └── registry.service.ts      # Бизнес-логика, in-memory store + GC
│       └── presentation/
│           └── routes.ts                # Fastify route plugin
└── presentation/
    └── app.ts                           # Fastify app factory
```

## Архитектурные правила

- **`domain/`** — чистые типы и функции, ноль зависимостей на Fastify/Zod
- **`application/`** — бизнес-логика, возвращает `Result<T, E>` через neverthrow
- **`presentation/`** — Zod валидация входа, маппинг Result → HTTP статус
- In-memory store → позже заменяется на репозиторий с портом + адаптером
