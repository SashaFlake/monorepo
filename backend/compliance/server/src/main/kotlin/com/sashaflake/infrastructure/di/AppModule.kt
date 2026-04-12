package com.sashaflake.infrastructure.di

import compliance.command.CreateExampleHandler
import compliance.port.ExampleRepository
import compliance.port.IdGenerator
import com.sashaflake.infrastructure.adapter.InMemoryExampleRepository
import com.sashaflake.infrastructure.adapter.UuidIdGenerator
import com.sashaflake.infrastructure.metrics.ServiceMetrics
import org.koin.dsl.module

object AppModule {
    fun create() =
        module {
            single<ExampleRepository> { InMemoryExampleRepository() }
            single<IdGenerator> { UuidIdGenerator() }
            single { ServiceMetrics() }
            single { CreateExampleHandler(get(), get()) }
        }
}
