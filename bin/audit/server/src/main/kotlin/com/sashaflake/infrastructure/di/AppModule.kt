package com.sashaflake.infrastructure.di

import audit.command.CreateExampleHandler
import audit.port.ExampleRepository
import audit.port.IdGenerator
import com.sashaflake.infrastructure.adapter.InMemoryExampleRepository
import com.sashaflake.infrastructure.adapter.UuidIdGenerator
import com.sashaflake.infrastructure.metrics.ServiceMetrics
import org.koin.dsl.module

// Единственное место, где собирается весь граф зависимостей.
object AppModule {
    fun create() =
        module {
            // Репозитории
            single<ExampleRepository> { InMemoryExampleRepository() }

            // Адаптеры
            single<IdGenerator> { UuidIdGenerator() }

            // Метрики
            single { ServiceMetrics() }

            // Хендлеры
            single { CreateExampleHandler(get(), get()) }

            // TODO: добавить остальные зависимости
        }
}
