# Service Mesh — Control Plane

Учебный проект: Control Plane для Service Mesh.  
Цель — освоить Node.js бэкенд, React фронтенд и деплой в Kubernetes.

---

## Что это

Control Plane управляет сервисной сеткой: хранит реестр сервисов, раздаёт конфигурацию data plane нодам, предоставляет UI оператора.

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
                             │ xDS / REST
                    ┌────────▼────────┐
                    │  Data Plane     │
                    │  (mock-service) │
                    └─────────────────┘
```

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
    ├── terraform/           # Инфраструктура Cloud.ru
    └── ops/                 # Скрипты обслуживания
```

---

## Компоненты

### Backend — Control Plane API

Node.js сервер на **Fastify v5 + TypeScript**.  
Архитектура: модульный монолит с разделением `domain / application / presentation`.  
Текущий модуль: **Registry** (регистрация сервисов, heartbeat, lookup).

→ [`backend/service-mesh/README.md`](./backend/service-mesh/README.md)

### Frontend — Admin UI

**React 19 + Vite + TanStack Router/Query**.  
Local-first: данные кешируются в localStorage через TanStack Query persist.  
Экраны: Dashboard, Services, Routes, Policies, Revisions, Nodes.

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
- [x] Service Registry (in-memory store, heartbeat, GC)
- [ ] Persist: PostgreSQL репозиторий (порт + адаптер)
- [ ] Health агрегация (статус ноды по heartbeat)
- [ ] Config distribution (раздача конфига data plane)
- [ ] Auth middleware (JWT)

### Frontend
- [ ] Dashboard (KPIs + services overview)
- [ ] Services & Instances экран
- [ ] Routes экран
- [ ] Policies экран
- [ ] Revisions / Config history

### Infra
- [ ] Helm chart для k3s деплоя
- [ ] CI (GitHub Actions: build + push image)
- [ ] Деплой на Cloud.ru
