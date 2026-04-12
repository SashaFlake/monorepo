# Backend Service Template

Шаблон для создания нового backend-сервиса. Следует той же архитектуре, что и `auth`-сервис: **Clean Architecture** с разделением на `domain` и `server`.

## Структура

```
{service-name}/
├── build.gradle.kts          # Корневые плагины
├── settings.gradle.kts       # Модули :domain, :server
├── gradle.properties         # Версии зависимостей
├── .editorconfig
├── .gitignore
├── domain/                   # Чистая бизнес-логика (без фреймворков)
│   ├── build.gradle.kts
│   └── src/
│       ├── commonMain/kotlin/{service}/
│       │   ├── model/        # Domain-модели (value objects, entities)
│       │   ├── command/      # Use-cases: команды + хендлеры
│       │   └── port/         # Интерфейсы для внешних зависимостей
│       └── commonTest/kotlin/  # Unit-тесты хендлеров и моделей
└── server/                   # Инфраструктура + delivery (Ktor)
    ├── build.gradle.kts
    └── src/
        ├── main/
        │   ├── kotlin/com/sashaflake/
        │   │   ├── Application.kt
        │   │   ├── infrastructure/
        │   │   │   ├── adapter/      # Реализации портов (DB, external APIs)
        │   │   │   ├── di/           # Koin-модуль (AppModule)
        │   │   │   ├── graphql/      # GraphQL context factory
        │   │   │   ├── metrics/      # Micrometer counters + timers
        │   │   │   ├── persistence/  # Репозитории (Dragonfly / Postgres)
        │   │   │   └── plugins/      # Ktor-плагины (GraphQL, HTTP, Security…)
        │   │   └── presentation/
        │   │       ├── Routing.kt
        │   │       ├── graphql/      # Query / Mutation классы
        │   │       └── routes/       # REST-роуты (metrics и др.)
        │   └── resources/
        │       ├── application.conf
        │       └── logback.xml
        └── test/
            ├── kotlin/com/sashaflake/graphql/  # Интеграционные тесты
            └── resources/logback.xml
```

## Как использовать

1. Скопируй папку `template/` в `backend/{service-name}/`
2. Замени все вхождения `__SERVICE__` на имя сервиса (например `notification`)
3. Замени `__PACKAGE__` на имя пакета (например `notification`)
4. Добавь свои domain-модели в `domain/src/commonMain/kotlin/__PACKAGE__/model/`
5. Реализуй команды/хендлеры в `domain/src/commonMain/kotlin/__PACKAGE__/command/`
6. Объяви порты в `domain/src/commonMain/kotlin/__PACKAGE__/port/`
7. Реализуй адаптеры в `server/src/main/kotlin/com/sashaflake/infrastructure/adapter/`

## Архитектурные правила

- **`domain`** — zero Ktor/Koin/DB зависимостей. Только Kotlin stdlib + Arrow (Either).
- **Порты** — интерфейсы в `domain`, реализации в `server/infrastructure/adapter/`.
- **Хендлеры** возвращают `Either<Error, Result>` — никаких исключений для бизнес-ошибок.
- **Metrics** — каждая операция имеет Counter (attempt/success/failure) + Timer.
- **DI** — всё через Koin, `AppModule.kt` — единственное место wire-up.
