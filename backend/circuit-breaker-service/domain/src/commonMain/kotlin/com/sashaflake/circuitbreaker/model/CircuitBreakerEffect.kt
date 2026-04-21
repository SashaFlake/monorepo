package com.sashaflake.circuitbreaker.model

import kotlinx.coroutines.CompletableDeferred
import kotlin.time.Duration

/**
 * Явное описание side-effect — не его выполнение.
 *
 * reduce() возвращает List<CircuitBreakerEffect> вместо того,
 * чтобы выполнять IO прямо внутри себя. Интерпретатор (актор)
 * получает этот список и выполняет эффекты в нужном контексте.
 *
 * Паттерн: Elm Architecture / Free Monad lite.
 */
sealed interface CircuitBreakerEffect {
    /** Запустить переданный suspend-блок и отправить результат обратно в канал. */
    data class RunBlock(
        val block: suspend () -> Unit,
        val reply: CompletableDeferred<CallResult>,
    ) : CircuitBreakerEffect

    /** Завершить deferred конкретным результатом. */
    data class CompleteReply(
        val reply: CompletableDeferred<CallResult>,
        val result: CallResult,
    ) : CircuitBreakerEffect

    /** Запланировать переход OPEN → HALF_OPEN через [delay]. */
    data class ScheduleReset(val delay: Duration) : CircuitBreakerEffect

    /** Сохранить события в EventStore. */
    data class StoreEvents(val events: List<CircuitBreakerEvent>) : CircuitBreakerEffect

    /** Залогировать сообщение. */
    sealed interface Log : CircuitBreakerEffect {
        val id: CircuitBreakerId
        val message: String

        data class Info(override val id: CircuitBreakerId, override val message: String) : Log
        data class Warn(override val id: CircuitBreakerId, override val message: String) : Log
    }
}
