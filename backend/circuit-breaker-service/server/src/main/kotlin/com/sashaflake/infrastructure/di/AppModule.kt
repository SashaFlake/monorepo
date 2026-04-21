package com.sashaflake.infrastructure.di

import com.eventstore.dbclient.EventStoreDBClient
import com.eventstore.dbclient.EventStoreDBConnectionString
import com.sashaflake.circuitbreaker.application.port.EventStore
import com.sashaflake.circuitbreaker.model.CircuitBreakerConfig
import com.sashaflake.infrastructure.actor.CircuitBreakerRegistry
import com.sashaflake.infrastructure.persistence.EventStoreDbEventStore
import com.sashaflake.infrastructure.persistence.InMemoryEventStore
import com.sashaflake.presentation.CircuitBreakerHandler
import org.koin.dsl.module
import kotlin.time.Duration.Companion.seconds

object AppModule {
    fun create() =
        module {
            // Глобальный конфиг CB по умолчанию
            single {
                CircuitBreakerConfig(
                    failureThreshold = 3,
                    resetTimeout = 10.seconds,
                    successThreshold = 1,
                )
            }

            // EventStore: EventStoreDB или InMemory под флаг
            single<EventStore> {
                val useInMemory = System.getenv("USE_IN_MEMORY_STORE") == "true"
                if (useInMemory) {
                    InMemoryEventStore()
                } else {
                    val connectionString = System.getenv("EVENTSTOREDB_CONNECTION_STRING")
                        ?: "esdb://localhost:2113?tls=false"
                    val settings = EventStoreDBConnectionString.parseOrThrow(connectionString)
                    val client = EventStoreDBClient.create(settings)
                    EventStoreDbEventStore(client)
                }
            }

            // Реестр акторов — singleton, владеет CoroutineScope
            single { CircuitBreakerRegistry(get(), get()) }

            // HTTP-хендлер
            single { CircuitBreakerHandler(get()) }
        }
}
