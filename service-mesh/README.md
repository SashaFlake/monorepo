# Service Mesh — Control Plane

Учебный проект: Control Plane для Service Mesh.  
Цель — освоить Node.js бэкенд, React фронтенд и деплой в Kubernetes.

---

## Что это

Control Plane управляет сервисной сеткой: хранит реестр сервисов, раздаёт правила маршрутизации data plane нодам, предоставляет UI оператора.

```
┌─────────────────────────────────────────┐
│              Control Plane              │
│                                         │
│   ┌──────────┐     ┌────────────────┐   │
│   │ Admin UI │────▶│    Backend     │   │
│   │ (React)  │     │   (Fastify)    │   │
│   └──────────┘     └───────┬────────┘   │
│                            │            │
└────────────────────────────┼────────────┘
                             │ REST (pull)
                    ┌────────▼────────┐
                    │  Data Plane     │
                    │  (mock-service) │
                    └─────────────────┘
```

---

## MVP Scope

**В скоупе:**
- **Service Registry** — регистрация, heartbeat, health status, lookup
- **Routing Rules** — CRUD правил маршрутизации (weighted routing, canary)
- **Config Distribution** — mock-сервис пуллит правила и применяет их
- **Admin UI** — Dashboard, Services, Routes

**За скоупом MVP:**
- Auth / JWT
- Policies (retry, circuit breaker, timeout)
- Revisions / Config history
- PostgreSQL persist (сначала in-memory, потом добавим)

---

## Структура монорепо

```
service-mesh/
├── backend/
│   ├── service-mesh/      # Control plane API (Fastify + TypeScript)
│   └── mock-service/      # Имитация data plane ноды
├── frontend/
│   └── service-mesh/      # Admin UI (React + Vite)
└── infra/
    ├── docker-compose.yaml  # Локальный стенд
    ├── helm/                # Helm chart для k8s
    └── ops/                 # Скрипты обслуживания
```

---

## Компоненты

### Backend — Control Plane API

Node.js сервер на **Fastify v5 + TypeScript**.  
Архитектура: модульный монолит с разделением `domain / application / presentation`.  
Модули: **Registry** (готов), **Routing** (в разработке).

→ [`backend/service-mesh/README.md`](./backend/service-mesh/README.md)

### Mock Service — Data Plane

Имитация data plane ноды: регистрируется в Registry, периодически пуллит routing rules и применяет их при проксировании запросов.

→ [`backend/mock-service/README.md`](./backend/mock-service/README.md)

### Frontend — Admin UI

**React 19 + Vite + TanStack Router/Query**.  
Local-first: данные кешируются через TanStack Query persist.  
Экраны MVP: Dashboard, Services, Routes.

→ [`frontend/service-mesh/README.md`](./frontend/service-mesh/README.md)

### Infra

Локальный стенд через `docker-compose.yaml`.  
Деплой в **k3s** на Cloud.ru (1 master + 1 worker) через Helm.

→ [`infra/`](./infra/)

---

## Быстрый старт (локально)

```bash
# Поднять всё через docker-compose
cd service-mesh/infra
docker compose up

# Или по-отдельности:

# Backend
cd service-mesh/backend/service-mesh
npm install && npm run dev       # http://localhost:4000

# Mock service
cd service-mesh/backend/mock-service
npm install && npm run dev       # http://localhost:4001

# Frontend
cd service-mesh/frontend/service-mesh
npm install && npm run dev       # http://localhost:5173
```

---

## Стек

| Слой | Технология |
|---|---|
| Backend runtime | Node.js 20 + TypeScript |
| HTTP framework | Fastify v5 |
| Валидация | Zod |
| Result type | neverthrow |
| Frontend | React 19 + Vite |
| Роутинг | TanStack Router |
| Стейт / кеш | TanStack Query + Zustand |
| CSS | Tailwind v4 |
| Контейнеры | Docker + k3s (k8s) |
| Облако | Cloud.ru (2 VM: master + worker) |

---

## Принципы разработки

- **FP-first** — функциональный подход как база; `Result<T,E>` вместо исключений
- **Local-first (Frontend)** — UI работает с локальным кешем, синхронизация в фоне
- **Domain / Application / Presentation** — чёткое разделение слоёв в бэкенде
- **Учебный проект** — цель освоить стек, а не построить production-оптимальную систему

---

## Роадмап

### Backend

- [x] Service Registry — регистрация, heartbeat, GC (in-memory)
- [ ] Health агрегация — статус ноды по heartbeat (healthy / unhealthy / dead)
- [ ] Routing Rules — CRUD правил маршрутизации (weighted routing)
- [ ] Config Distribution — эндпоинт для пулла правил data plane нодой

### Mock Service

- [ ] Регистрация в Registry при старте
- [ ] Периодический пулл routing rules у Control Plane
- [ ] Применение правил при проксировании (weighted round-robin)

### Frontend

- [ ] Dashboard — KPIs: кол-во сервисов, нод, health overview
- [ ] Services экран — список инстансов, статус, uptime
- [ ] Routes экран — CRUD правил маршрутизации

### Infra

- [ ] Helm chart для k3s деплоя
- [ ] CI — GitHub Actions: build + push Docker image
- [ ] Деплой на Cloud.ru
