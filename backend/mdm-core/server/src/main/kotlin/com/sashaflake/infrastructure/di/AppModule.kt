package com.sashaflake.infrastructure.di

import __PACKAGE__.command.CreateExampleHandler
import __PACKAGE__.port.ExampleRepository
import __PACKAGE__.port.IdGenerator
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
