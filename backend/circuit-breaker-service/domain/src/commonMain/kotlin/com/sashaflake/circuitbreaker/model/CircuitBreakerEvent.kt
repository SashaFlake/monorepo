package com.sashaflake.circuitbreaker.model

import kotlin.time.Instant

/**
 * Факт — то, что уже случилось. Неизменяемо.
 *
 * Отличие от [CircuitBreakerMessage] (намерение):
 *   Message = команда (что хочет произойти)
 *   Event   = факт (что уже произошло)
 *
 * Полная история событий = полное состояние CB.
 * fold(initial, apply) по списку событий → восстановленное состояние.
 */
sealed interface CircuitBreakerEvent {
    val id: CircuitBreakerId
    val occurredAt: Instant

    data class CallSucceeded(
        override val id: CircuitBreakerId,
        override val occurredAt: Instant,
    ) : CircuitBreakerEvent

    data class CallFailed(
        override val id: CircuitBreakerId,
        override val occurredAt: Instant,
        val cause: String,
    ) : CircuitBreakerEvent

    data class CallRejected(
        override val id: CircuitBreakerId,
        override val occurredAt: Instant,
    ) : CircuitBreakerEvent

    data class CircuitOpened(
        override val id: CircuitBreakerId,
        override val occurredAt: Instant,
    ) : CircuitBreakerEvent

    data class CircuitClosed(
        override val id: CircuitBreakerId,
        override val occurredAt: Instant,
    ) : CircuitBreakerEvent

    data class ResetTriggered(
        override val id: CircuitBreakerId,
        override val occurredAt: Instant,
    ) : CircuitBreakerEvent
}
