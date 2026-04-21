package com.sashaflake.circuitbreaker.model

import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds

/**
 * Value object — конфигурация одного Circuit Breaker.
 *
 * @param failureThreshold  сколько ошибок подряд переводит CB в OPEN
 * @param resetTimeout      через сколько времени CB из OPEN переходит в HALF_OPEN
 * @param successThreshold  сколько успехов подряд в HALF_OPEN переводят CB обратно в CLOSED
 */
data class CircuitBreakerConfig(
    val failureThreshold: Int = 3,
    val resetTimeout: Duration = 10.seconds,
    val successThreshold: Int = 1,
)
