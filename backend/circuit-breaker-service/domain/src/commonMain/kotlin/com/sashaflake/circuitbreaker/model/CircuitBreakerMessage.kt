package com.sashaflake.circuitbreaker.model

import kotlinx.coroutines.CompletableDeferred

/**
 * Все сообщения, которые понимает CircuitBreakerActor.
 * sealed interface — компилятор гарантирует исчерпывающий when.
 *
 * Живёт в домене, чтобы reduce() был чистой функцией без инфраструктурных зависимостей.
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

    /**
     * Внутреннее сообщение: блок выполнен, вот результат.
     * Отправляется самим актором после завершения block().
     */
    data class BlockResult(
        val result: CallResult,
        val reply: CompletableDeferred<CallResult>,
    ) : CircuitBreakerMessage

    /** Внутреннее сообщение: таймер истёк, пробуем перейти OPEN → HALF_OPEN. */
    data object TryReset : CircuitBreakerMessage
}
