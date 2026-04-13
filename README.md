# MDM Platform (monorepo)

Корпоративная платформа управления устройствами (Mobile Device Management).  
Цель: устройство проходит enrollment, система контролирует его состояние и сообщает внешним системам, имеет ли оно доступ к внутренним ресурсам.

---

<details>
<summary><strong>Сервисы и взаимодействие</strong></summary>

```mermaid
flowchart TD
    ExternalSystem(["External System\nERP / ITSM"])
    Device(["Android Device\n+ Agent"])
    Operator(["Operator\nAdmin UI"])
    ExtServices(["External Services\nVPN / Proxy / NAC"])

    subgraph Platform
        GW["API Gateway\n+ Auth Middleware"]

        subgraph Core["MDM Core Service"]
            Enroll["Enrollment"]
            Cmd["Command Queue"]
            Policy["Policy"]
            DevReg["Device Registry"]
            TrustStore["Trust Anchor Store"]
        end

        Compliance["Compliance Service"]
        Audit["Audit Service"]
        Notification["Notification Service\n(future)"]
        Bus[["Kafka"]]
    end

    ExternalSystem -->|"событие: devices.provisioned"| Bus
    Bus -->|"devices.provisioned"| Enroll

    Device -->|"POST /device/attestation/nonce"| GW
    Device -->|"POST /device/enroll + attestation"| GW
    Device -->|"POST /device/heartbeat"| GW
    Device -->|"POST /device/commands/:id/ack"| GW
    Device <-->|"SSE\ncommand delivery"| GW

    Operator -->|"HTTP + JWT"| GW
    GW -->|"route"| Core
    GW -->|"route"| Compliance

    Enroll -->|"verify cert chain"| TrustStore
    Enroll -->|"create"| DevReg
    Enroll -->|"enqueue APPLY_POLICY"| Cmd
    Policy -->|"enqueue APPLY_POLICY on update"| Cmd
    Cmd -->|"deliver"| Device
    Cmd -->|"update status"| DevReg

    Compliance -->|"read"| DevReg
    Compliance -->|"read"| Policy
    ExtServices -->|"GET /compliance"| Compliance

    Core -->|"mdm.events.*"| Bus
    Bus -->|"mdm.events.*"| Audit
    Bus -->|"mdm.events.device.offline"| Notification

    Operator <-->|"SSE\nreal-time updates"| GW
```

### Описание сервисов

| Сервис | Ответственность |
|---|---|
| **API Gateway** | Единая точка входа. Роутинг, auth middleware (JWT / device cert / service token), SSE транспорт |
| **MDM Core** | Device Registry, Enrollment, Command Queue, Policy — всё про жизнь устройства |
| **Trust Anchor Store** | Хранилище корневых сертификатов производителей. Используется при верификации attestation |
| **Compliance Service** | Read-only фасад для внешних систем. Вычисляет доверие на основе данных Core |
| **Audit Service** | Подписывается на все события через Kafka. Append-only хранилище |
| **Kafka** | Персистентная шина событий. Декаплинг сервисов, гарантия доставки, replay |
| **Notification Service** | (future) Подписывается на события, отправляет FCM/APNs push |
| **Admin UI** | Real-time dashboard. Local-first: читает из локального стора, синхронизируется через SSE |

</details>

---

<details>
<summary><strong>Транспортный слой</strong></summary>

## Решения

### Gateway — Kubernetes Ingress

Единая точка входа — nginx Ingress в Kubernetes. Отдельного Gateway-сервиса нет.

Аннотации для долгоживущих SSE-соединений:
```yaml
nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
nginx.ingress.kubernetes.io/proxy-buffering: "off"
```

---

### Изоляция клиентов — URL-префиксы

Один порт, разные префиксы. Изоляция через middleware в API Gateway (разные стратегии аутентификации).

| Префикс | Клиент | Auth |
|---|---|---|
| `/admin/*` | Оператор | JWT (Bearer token) — админы авторизованы внешне |
| `/device/*` | Android Agent | Device certificate (post-enrollment) / enrollment token (pre-enrollment) |
| `/external/*` | Внешние системы | Service token |

---

### Push-транспорт — SSE

SSE (Server-Sent Events) — единственный push-транспорт для всех клиентов.  
WebSocket не используется: команды однонаправлены (сервер → устройство), ACK отправляется отдельным REST-запросом.

---

### Offline-доставка команд

Команды персистируются в Command Queue (Postgres) немедленно. Доставка — при подключении устройства через SSE-стрим. Если устройство долго offline — push-уведомление через Notification Service (FCM/APNs, за скоупом MVP).

```
QUEUED → [устройство подключилось] → DELIVERED → [ack получен] → ACKED
                                          ↓
                                        FAILED → RETRYING → EXPIRED
```

При каждом SSE-подключении сначала отдаются все `QUEUED` команды из таблицы, затем live-стрим. `Last-Event-ID` — подсказка, не источник истины. Command Queue всегда авторитетна.

---

### SSE state — in-memory → Redis

MVP использует in-memory хранилище активных SSE-соединений.  
Production-цель — Redis pub/sub. Изоляция через порт `EventPublisher`:

```
EventPublisher (port)
  ├── InMemoryEventPublisher   ← MVP
  └── RedisEventPublisher      ← production
```

---

### Асинхронное межсервисное взаимодействие — Kafka

Kafka — единственная шина для всего асинхронного взаимодействия: внешние интеграции, внутренние события, будущие сервисы.

| Топик | Producer | Consumer(s) | Описание |
|---|---|---|---|
| `devices.provisioned` | ERP / ITSM | MDM Core | Устройство зарегистрировано в закупках |
| `mdm.events.device.enrolled` | MDM Core | Audit, Notification (future) | Успешный enrollment |
| `mdm.events.device.status_changed` | MDM Core | Audit, Notification (future) | Смена статуса устройства |
| `mdm.events.device.offline` | MDM Core | Audit, Notification (future) | Устройство не выходило на связь > 5 мин |
| `mdm.events.command.acked` | MDM Core | Audit | Команда подтверждена агентом |
| `mdm.events.command.failed` | MDM Core | Audit, Notification (future) | Команда не выполнена |
| `mdm.events.policy.updated` | MDM Core | Audit | Политика обновлена |

**Соглашения:**
- Топики платформы: `mdm.events.{domain}.{event}` — snake_case
- Входящие из внешних систем: `{domain}.{event}` — формат на стороне источника
- Все события содержат `event_id`, `timestamp`, `device_id`, `actor`

---

## Эндпоинты

| Клиент | Транспорт | Метод | Путь | Назначение |
|---|---|---|---|---|
| Оператор | REST | `GET` | `/admin/devices` | Список устройств |
| Оператор | REST | `POST` | `/admin/devices/{id}/commands` | Отправить команду |
| Оператор | SSE | `GET` | `/admin/events` | Реал-тайм обновления UI |
| Устройство | REST | `POST` | `/device/attestation/nonce` | Получить nonce для attestation |
| Устройство | REST | `POST` | `/device/enroll` | Enrollment с attestation |
| Устройство | REST | `POST` | `/device/heartbeat` | Heartbeat, sync check |
| Устройство | REST | `POST` | `/device/commands/{id}/ack` | Подтверждение команды |
| Устройство | SSE | `GET` | `/device/commands/stream` | Получение команд |
| Внешние системы | REST | `GET` | `/external/devices/{id}/compliance` | Compliance check |
| ERP / ITSM | Kafka | — | `devices.provisioned` | Pre-staging устройства |

</details>

---

<details>
<summary><strong>Безопасность</strong></summary>

## Device Attestation

Проблема enrollment без attestation: любой, знающий `serial + enrollment_token`, может зарегистрировать произвольное устройство под чужим серийником.

**Решение — офлайн аппаратная аттестация (Android Keystore)**

Используется криптографическое доказательство от защищённого элемента самого устройства. Производитель (Samsung Knox, Zebra и др.) прошивает ключи при производстве. Не требует внешних сервисов, работает в изолированных сетях.

### Enrollment становится двухшаговым

```
Шаг 1 — запрос nonce:
  Устройство  →  POST /device/attestation/nonce  { serial }
  MDM Core    ←  { nonce }  (одноразовый, TTL ограничен, привязан к serial)

Шаг 2 — enrollment с аттестацией:
  Устройство подписывает nonce ключом из Android Keystore
  Устройство  →  POST /device/enroll  {
                   serial,
                   enrollment_token,
                   attestation: { cert_chain, signed_nonce }
                 }

  MDM Core верифицирует:
    1. cert_chain ведёт к доверенному корневому сертификату (Trust Anchor Store)
    2. signed_nonce валиден для этого serial
    3. nonce ранее не использовался (защита от replay)
    4. enrollment_token совпадает
        ↓
  Создаётся device_id, выдаётся device certificate
```

### Trust Anchor Store

Хранилище корневых сертификатов производителей внутри платформы. Верификация цепочки происходит локально — без обращения к внешним сервисам.

**Операционное требование:** при смене корневого сертификата производителем Trust Anchor Store должен быть обновлён вручную командой infra. Это процесс, не автоматика.

### Nonce реестр

MDM Core хранит выданные nonce с TTL. Каждый nonce одноразовый: после использования немедленно инвалидируется. Истёкшие nonce удаляются по TTL.

---

## SSE изоляция по device_id

`device_id` в SSE-сессии берётся **только из верифицированного device certificate** — никогда из query-параметров или тела запроса. Устройство физически не может подписаться на команды другого устройства.

---

## Rate Limiting

Первый барьер — nginx Ingress (защита от DDoS на уровне IP).  
Второй барьер — application middleware (защита от злоупотреблений конкретного устройства, лимит по `device_id` из сертификата).

`/device/enroll` и `/device/attestation/nonce` лимитируются жёстче остальных эндпоинтов.

---

## Backlog (за скоупом MVP)

| Пункт | Приоритет |
|---|---|
| Kafka ACL — каждый сервис читает только свои топики | High |
| Ротация и отзыв service token для `/external/*` | High |
| mTLS между внутренними сервисами | Medium |
| Circuit breaker на межсервисных вызовах | Medium |

</details>

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

Одноразовый процесс принятия устройства в систему. Верифицирует аттестацию устройства через Trust Anchor Store, проверяет что устройство **ожидается** (pre-staged) и токен валиден, создаёт идентификатор устройства и выдаёт credentials. По завершении автоматически инициирует первую команду `APPLY_POLICY`.

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

</details>

---

<details>
<summary><strong>Сценарии</strong></summary>

## MVP-сценарии

### Сценарий 1 — Device Pre-staging (внешнее событие)

Закупки приобретают новое устройство и регистрируют его во внешней системе (ERP, ITSM и т.п.).  
Наша система получает событие через **Kafka** (topic `devices.provisioned`).  
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

### Сценарий 2 — Enrollment (с аттестацией)

Устройство на точке использования инициирует enrollment (агент установлен в factory/MDM-режиме).

```
Устройство  →  POST /device/attestation/nonce  { serial }
MDM Core    ←  { nonce }  (одноразовый, TTL = 5 мин)

Устройство подписывает nonce ключом из Android Keystore

Устройство  →  POST /device/enroll  {
                 serial, enrollment_token,
                 attestation: { cert_chain, signed_nonce }
               }
                       ↓
             Верификация cert_chain через Trust Anchor Store
             Проверка signed_nonce (валиден + не использован ранее)
             Проверка enrollment_token
             Проверка: serial существует и статус PENDING_ENROLLMENT
                       ↓
             Создаётся device_id (UUID)
             Выдаётся device certificate
             Статус → ENROLLING
                       ↓
Устройство  ←  { device_id, certificate, sse_endpoint, policy_version: 0 }
```

После успешного ответа система автоматически ставит в очередь команду `APPLY_POLICY`  
и публикует событие `mdm.events.device.enrolled` в Kafka.

---

### Сценарий 3 — Policy Push и подтверждение

```
Command Queue  →  APPLY_POLICY { policy_id, payload: { ... } }
                       ↓
Устройство получает команду через SSE-стрим (или при следующем heartbeat если offline)
                       ↓
Агент применяет политику (пароль, шифрование, запрет приложений и т.п.)
                       ↓
Устройство  →  POST /device/commands/{command_id}/ack  { status: "success" | "failed", error? }
                       ↓
             Статус устройства → ENROLLED (compliant) или NON_COMPLIANT
             Публикуется mdm.events.command.acked → Audit
```

**Команды персистентны** — если устройство offline, команда остаётся в очереди до получения ack или истечения TTL.

---

### Сценарий 4 — Compliance Check (интеграция с внешними системами)

Внешние системы (VPN-шлюз, reverse proxy, NAC) могут проверить статус устройства:

```
GET /external/devices/{device_id}/compliance
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

Оператор через Admin UI (или API) отправляет команду на устройство — см. таблицу в доменной модели.

```
POST /admin/devices/{device_id}/commands
{ "type": "LOCK", "initiated_by": "admin@corp.com" }

← 202 Accepted  { "command_id": "...", "status": "queued" }
```

Команда доставляется через SSE-стрим (если устройство online) или при следующем heartbeat.

---

### Сценарий 6 — Heartbeat и обнаружение offline

```
Агент  →  POST /device/heartbeat  { device_id, battery, os_version, policy_version }
                ↓
          Обновляется last_seen, статус ONLINE
          Если policy_version устарела → возвращается { action: "sync_policy" }
                ↓
          Если нет heartbeat > 5 минут → статус OFFLINE
          Публикуется mdm.events.device.offline → Audit + Notification (future)
          SSE event → UI обновляется без перезагрузки
```

---

## Что вне скоупа MVP

- Интеграция с реальным Android MDM Agent (используется симулятор агента)
- Apple iOS / Windows устройства
- Логика внешней системы provisioning (ERP/ITSM) — только входящий event
- BYOD / личные устройства сотрудников
- Геолокация и геофенсинг
- Notification Service (FCM/APNs push для offline-устройств)

</details>
