# MDM Platform (monorepo)

Корпоративная платформа управления устройствами (Mobile Device Management).  
Цель: устройство проходит enrollment, система контролирует его состояние и сообщает внешним системам, имеет ли оно доступ к внутренним ресурсам.

---

<details>
<summary><strong>Архитектура и сценарии</strong></summary>

## Обзор системы

```
┌─────────────────────────────────────────────────────────┐
│                    Platform Layer                        │
│          API Gateway · Auth · Event Bus · Audit          │
├──────────────────────┬──────────────────────────────────┤
│     MDM Core Service │   Compliance Query API           │
│  enrollment, commands│   /devices/{id}/compliance       │
│  policy, heartbeat   │   для внешних систем (VPN, proxy) │
├──────────────────────┴──────────────────────────────────┤
│              PostgreSQL  ·  NATS JetStream               │
└─────────────────────────────────────────────────────────┘
```

**Тип устройств:** корпоративные Android-устройства (телефоны, планшеты, терминалы).  
**UI:** real-time dashboard через SSE; агент ↔ сервер через WebSocket.  
**Local-first:** UI читает из локального стора (IndexedDB/Dexie.js), синхронизируется при reconnect.

---

## Жизненный цикл устройства

```
UNKNOWN → PENDING_ENROLLMENT → ENROLLING → ENROLLED (compliant)
                                                 ↓
                                          NON_COMPLIANT
                                                 ↓
                                            OFFLINE
                                                 ↓
                                            WIPED / RETIRED
```

---

## MVP-сценарии

### Сценарий 1 — Device Pre-staging (внешнее событие)

Закупки приобретают новое устройство и регистрируют его во внешней системе (ERP, ITSM и т.п.).  
Наша система получает событие через **Message Bus** (NATS topic `devices.provisioned`).  
Формат интеграции — за скоупом этой системы; на входе ожидается:

```json
{
  "event": "device.provisioned",
  "serial": "SN-XXXXXXXX",
  "model": "Samsung Galaxy XCover 6",
  "assigned_location": "warehouse-msk-01"
}
```

После получения события система создаёт запись устройства со статусом `PENDING_ENROLLMENT`  
и генерирует одноразовый **enrollment token**, привязанный к серийному номеру.

> ⚙️ Интеграция описана в [`docs/integration-provisioning.md`](docs/integration-provisioning.md) *(coming soon)*

---

### Сценарий 2 — Enrollment

Устройство на точке использования инициирует enrollment (агент установлен в factory/MDM-режиме).

```
Устройство  →  POST /api/v1/enroll  { serial, enrollment_token, device_info }
                       ↓
             Проверка: serial существует и статус PENDING_ENROLLMENT
             Проверка: enrollment_token валиден и не истёк
                       ↓
             Создаётся device_id (UUID)
             Выдаётся device certificate (для последующих запросов mTLS)
             Статус → ENROLLING
                       ↓
Устройство  ←  { device_id, certificate, ws_endpoint, policy_version: 0 }
```

После успешного ответа система автоматически ставит в очередь команду `APPLY_POLICY`.

---

### Сценарий 3 — Policy Push и подтверждение

```
Command Queue  →  APPLY_POLICY { policy_id, payload: { ... } }
                       ↓
Устройство получает команду через WebSocket (или при следующем heartbeat если offline)
                       ↓
Агент применяет политику (пароль, шифрование, запрет приложений и т.п.)
                       ↓
Устройство  →  POST /api/v1/commands/{command_id}/ack  { status: "success" | "failed", error? }
                       ↓
             Статус устройства → ENROLLED (compliant) или NON_COMPLIANT
             Запись в Audit Log
```

**Команды персистентны** — если устройство offline, команда остаётся в очереди до получения ack или истечения TTL.

---

### Сценарий 4 — Compliance Check (интеграция с внешними системами)

Внешние системы (VPN-шлюз, reverse proxy, NAC) могут проверить статус устройства:

```
GET /api/v1/devices/{device_id}/compliance
Authorization: Bearer <service-token>

← 200 OK
{
  "device_id": "...",
  "enrolled": true,
  "compliant": true,
  "last_seen": "2026-04-12T20:00:00Z",
  "policy_version": 3
}
```

На основе этого ответа внешняя система принимает решение о допуске к внутренним ресурсам.  
Эндпоинт read-only, не требует агента, доступен внутри периметра.

> 🔐 Подробнее: [`docs/compliance-api.md`](docs/compliance-api.md) *(coming soon)*

---

### Сценарий 5 — Remote Commands

Оператор через Admin UI (или API) отправляет команду на устройство:

| Команда    | Описание                                    |
|------------|---------------------------------------------|
| `LOCK`     | Заблокировать экран                         |
| `UNLOCK`   | Разблокировать (с подтверждением оператора) |
| `NOTIFY`   | Показать уведомление на устройстве          |
| `WIPE`     | Сброс до заводских настроек                 |
| `SYNC`     | Принудительная синхронизация политик        |

```
POST /api/v1/devices/{device_id}/commands
{ "type": "LOCK", "initiated_by": "admin@corp.com" }

← 202 Accepted  { "command_id": "...", "status": "queued" }
```

Команда доставляется через WebSocket (если устройство online) или при следующем heartbeat.

---

### Сценарий 6 — Heartbeat и обнаружение offline

```
Агент  →  POST /api/v1/heartbeat  { device_id, battery, os_version, policy_version }
                ↓
          Обновляется last_seen, статус ONLINE
          Если policy_version устарела → возвращается { action: "sync_policy" }
                ↓
          Если нет heartbeat > 5 минут → статус OFFLINE
          SSE event → UI обновляется без перезагрузки
```

---

## Audit Log

Все действия над устройством записываются в иммутабельную таблицу `audit_log` (append-only):

| Поле         | Описание                                      |
|--------------|-----------------------------------------------|
| `timestamp`  | Время события (UTC)                           |
| `device_id`  | Идентификатор устройства                      |
| `actor`      | Кто инициировал: `system`, `admin@corp.com`   |
| `action`     | `enrollment`, `policy_applied`, `lock`, `wipe`, ... |
| `status`     | `success` / `failed`                          |
| `payload`    | JSON-детали события                           |

Audit Log не изменяется и не удаляется — только чтение через API.

---

## Что вне скоупа MVP

- Интеграция с реальным Android MDM Agent (используется симулятор агента)
- Apple iOS / Windows устройства
- Логика внешней системы provisioning (ERP/ITSM) — только входящий event
- BYOD / личные устройства сотрудников
- Геолокация и геофенсинг

</details>
