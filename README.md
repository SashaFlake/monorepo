# MDM Platform (monorepo)

Корпоративная платформа управления устройствами (Mobile Device Management).  
Цель: устройство проходит enrollment, система контролирует его состояние и сообщает внешним системам, имеет ли оно доступ к внутренним ресурсам.

---

<details>
<summary><strong>Доменная модель</strong></summary>

## Компоненты

### Device

Центральная сущность системы. Хранит факты о себе: идентификатор, серийный номер, модель, локация, версия применённой политики, время последнего контакта. Не принимает решений — только хранит факты.

**State machine:**
```
UNKNOWN → PENDING_ENROLLMENT → ENROLLING → ENROLLED
                                                ↓
                                         NON_COMPLIANT
                                                ↓
                                           OFFLINE
                                                ↓
                                         WIPED / RETIRED
```

---

### Enrollment

Одноразовый процесс принятия устройства в систему. Проверяет, что устройство **ожидается** (pre-staged) и токен валиден, создаёт идентификатор устройства и выдаёт credentials. По завершении автоматически инициирует первую команду `APPLY_POLICY`.

---

### Policy

Хранит **что именно** должно быть применено на устройстве. Версионируется — устройство всегда знает, актуальную ли версию оно применило. Не знает, как устройство применяет правила — это дело агента.

---

### Command

Единый механизм доставки намерений на устройство — и от оператора, и от системы. Хранит команду до получения ack, обеспечивает доставку даже если устройство было offline.

Политика взаимодействует с устройством через тот же механизм — путём порождения команды `APPLY_POLICY`.

**Типы команд:**

| Тип | Инициатор | Описание |
|---|---|---|
| `APPLY_POLICY` | система | Применить набор правил (payload: policy rules) |
| `LOCK` | оператор | Заблокировать экран |
| `UNLOCK` | оператор | Разблокировать |
| `NOTIFY` | оператор | Показать уведомление на устройстве |
| `WIPE` | оператор | Сброс до заводских настроек |
| `SYNC` | система / оператор | Принудительная синхронизация политик |

**Жизненный цикл команды:**
```
QUEUED → DELIVERED → ACKED
             ↓
           FAILED → RETRYING → EXPIRED
```

---

### Compliance

Отвечает на один вопрос: **можно ли доверять этому устройству сейчас?**  
Агрегирует факты из Device и Policy: enrolled? политика актуальна? last_seen свежий?  
Выдаёт единый ответ наружу — без деталей внутренней кухни.  
Не хранит своё состояние — вычисляет на основе данных других доменов.

---

### Audit Log

Фиксирует **что произошло** — иммутабельно и полно.  
Записывает каждое значимое событие во всех доменах: enrollment, смена политики, выполнение команд, смена статуса.  
Не изменяется, не удаляется. Только чтение.

| Поле | Описание |
|---|---|
| `timestamp` | Время события (UTC) |
| `device_id` | Идентификатор устройства |
| `actor` | Кто инициировал: `system`, `admin@corp.com` |
| `action` | `enrollment`, `policy_applied`, `lock`, `wipe`, ... |
| `status` | `success` / `failed` |
| `payload` | JSON-детали события |

---

## Связи между компонентами

```
                  ┌───────────────┐
                  │  Enrollment  │
                  └──────┬──────┘
                         │ создаёт Device
                         │ инициирует Command(APPLY_POLICY)
                         ↓
┌─────────┐      ┌───────────────┐      ┌──────────┐
│ Policy  │────▶│    Device    │◄────│  Command  │
└─────────┘      └───────┬───────┘      └──────────┘
 знает что         │ факты          порождает и
 применять        ↓ о состоянии     доставляет
                  ┌───────────────┐
                  │  Compliance  │
                  └───────┬───────┘
                         │ ответ наружу
                         ↓
                  внешние системы

         ╔═══════════════════════════╗
                  Audit Log
          (слушает всех, пишет всё)
         ╚═══════════════════════════╝
```

</details>

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

Оператор через Admin UI (или API) отправляет команду на устройство — см. таблицу выше.

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

## Что вне скоупа MVP

- Интеграция с реальным Android MDM Agent (используется симулятор агента)
- Apple iOS / Windows устройства
- Логика внешней системы provisioning (ERP/ITSM) — только входящий event
- BYOD / личные устройства сотрудников
- Геолокация и геофенсинг

</details>
