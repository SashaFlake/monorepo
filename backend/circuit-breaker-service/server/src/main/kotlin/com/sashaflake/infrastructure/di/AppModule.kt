package com.sashaflake.infrastructure.di

import com.sashaflake.circuitbreaker.model.CircuitBreakerConfig
import com.sashaflake.infrastructure.actor.CircuitBreakerRegistry
import com.sashaflake.presentation.CircuitBreakerHandler
import org.koin.dsl.module
import kotlin.time.Duration.Companion.seconds

object AppModule {
    fun create() =
        module {
            // Глобальный конфиг CB по умолчанию (можно переопределить per-id)
            single {
                CircuitBreakerConfig(
                    failureThreshold = 3,
                    resetTimeout = 10.seconds,
                    successThreshold = 1,
                )
            }

            // Реестр акторов — singleton, владеет CoroutineScope
            single { CircuitBreakerRegistry(get()) }

            // HTTP-хендлер
            single { CircuitBreakerHandler(get()) }
        }
}
