package com.sashaflake.infrastructure.actor

import com.sashaflake.circuitbreaker.model.CallResult
import kotlinx.coroutines.CompletableDeferred

/**
 * Все сообщения, которые понимает CircuitBreakerActor.
 * sealed interface — компилятор гарантирует исчерпывающий when.
 */
sealed interface CircuitBreakerMessage {
    /**
     * Выполнить вызов через CB.
     * [reply] — deferred, в который актор положит результат.
     */
    data class Execute(
        val block: suspend () -> Unit,
        val reply: CompletableDeferred<CallResult>,
    ) : CircuitBreakerMessage

    /** Внутреннее сообщение: таймер истёк, пробуем перейти OPEN → HALF_OPEN. */
    data object TryReset : CircuitBreakerMessage
}
