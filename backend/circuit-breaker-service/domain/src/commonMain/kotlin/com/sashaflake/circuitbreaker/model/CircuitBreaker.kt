package com.sashaflake.circuitbreaker.model

import kotlin.time.Clock
import kotlin.time.ExperimentalTime

/**
 * Aggregate root — состояние Circuit Breaker.
 * Чистая доменная модель без side-effects: все переходы — чистые функции.
 */
@OptIn(ExperimentalTime::class)
data class CircuitBreaker(
    val id: CircuitBreakerId,
    val config: CircuitBreakerConfig,
    val state: CircuitBreakerState = CircuitBreakerState.CLOSED,
    val failureCount: Int = 0,
    val successCount: Int = 0,
) {
    /** Можно ли пропустить вызов прямо сейчас? */
    fun isCallAllowed(): Boolean = when (state) {
        CircuitBreakerState.CLOSED -> true
        CircuitBreakerState.HALF_OPEN -> true
        CircuitBreakerState.OPEN -> false
    }

    /**
     * Чистый reducer: (State, Message) -> Triple<State, List<Effect>, List<Event>>.
     *
     * Не знает ни о корутинах, ни об IO — только о доменной логике.
     * Тестируется без всяких моков и suspend.
     */
    fun reduce(message: CircuitBreakerMessage): Triple<CircuitBreaker, List<CircuitBreakerEffect>, List<CircuitBreakerEvent>> {
        val now = Clock.System.now()
        return when (message) {
            is CircuitBreakerMessage.Execute -> {
                if (!isCallAllowed()) {
                    Triple(
                        this,
                        listOf(
                            CircuitBreakerEffect.CompleteReply(message.reply, CallResult.Rejected),
                            CircuitBreakerEffect.Log.Warn(id, "OPEN — rejecting call"),
                        ),
                        listOf(CircuitBreakerEvent.CallRejected(id, now)),
                    )
                } else {
                    Triple(
                        this,
                        listOf(CircuitBreakerEffect.RunBlock(message.block, message.reply)),
                        emptyList(),
                    )
                }
            }

            is CircuitBreakerMessage.BlockResult -> {
                val next = apply(
                    when (message.result) {
                        is CallResult.Success -> CircuitBreakerEvent.CallSucceeded(id, now)
                        is CallResult.Failure -> CircuitBreakerEvent.CallFailed(id, now, message.result.cause.message ?: "unknown")
                        is CallResult.Rejected -> CircuitBreakerEvent.CallRejected(id, now)
                    }
                )
                val events = mutableListOf<CircuitBreakerEvent>(
                    when (message.result) {
                        is CallResult.Success -> CircuitBreakerEvent.CallSucceeded(id, now)
                        is CallResult.Failure -> CircuitBreakerEvent.CallFailed(id, now, message.result.cause.message ?: "unknown")
                        is CallResult.Rejected -> CircuitBreakerEvent.CallRejected(id, now)
                    }
                )
                if (next.state == CircuitBreakerState.OPEN && state != CircuitBreakerState.OPEN) {
                    events += CircuitBreakerEvent.CircuitOpened(id, now)
                }
                if (next.state == CircuitBreakerState.CLOSED && state != CircuitBreakerState.CLOSED) {
                    events += CircuitBreakerEvent.CircuitClosed(id, now)
                }
                val effects = mutableListOf<CircuitBreakerEffect>(
                    CircuitBreakerEffect.Log.Info(id, "state=${next.state} failures=${next.failureCount}"),
                    CircuitBreakerEffect.CompleteReply(message.reply, message.result),
                )
                if (next.state == CircuitBreakerState.OPEN) {
                    effects += CircuitBreakerEffect.ScheduleReset(config.resetTimeout)
                }
                Triple(next, effects, events)
            }

            CircuitBreakerMessage.TryReset -> {
                val next = applyReset()
                Triple(
                    next,
                    listOf(CircuitBreakerEffect.Log.Info(id, "reset → state=${next.state}")),
                    listOf(CircuitBreakerEvent.ResetTriggered(id, now)),
                )
            }
        }
    }

    /**
     * Чистая функция применения события: (State, Event) -> State.
     * Используется для восстановления состояния из истории событий:
     * events.fold(initial) { cb, event -> cb.apply(event) }
     */
    fun apply(event: CircuitBreakerEvent): CircuitBreaker = when (event) {
        is CircuitBreakerEvent.CallSucceeded -> onSuccess()
        is CircuitBreakerEvent.CallFailed -> onFailure()
        is CircuitBreakerEvent.CallRejected -> this
        is CircuitBreakerEvent.CircuitOpened -> copy(state = CircuitBreakerState.OPEN, successCount = 0)
        is CircuitBreakerEvent.CircuitClosed -> copy(state = CircuitBreakerState.CLOSED, failureCount = 0, successCount = 0)
        is CircuitBreakerEvent.ResetTriggered -> applyReset()
    }

    // -------------------------------------------------------------------

    private fun applyReset(): CircuitBreaker = when (state) {
        CircuitBreakerState.OPEN -> copy(
            state = CircuitBreakerState.HALF_OPEN,
            failureCount = 0,
            successCount = 0,
        )
        else -> this
    }

    private fun onSuccess(): CircuitBreaker = when (state) {
        CircuitBreakerState.HALF_OPEN -> {
            val newSuccessCount = successCount + 1
            if (newSuccessCount >= config.successThreshold) {
                copy(state = CircuitBreakerState.CLOSED, failureCount = 0, successCount = 0)
            } else {
                copy(successCount = newSuccessCount)
            }
        }
        CircuitBreakerState.CLOSED -> copy(failureCount = 0)
        CircuitBreakerState.OPEN -> this
    }

    private fun onFailure(): CircuitBreaker = when (state) {
        CircuitBreakerState.CLOSED, CircuitBreakerState.HALF_OPEN -> {
            val newFailureCount = failureCount + 1
            if (newFailureCount >= config.failureThreshold) {
                copy(state = CircuitBreakerState.OPEN, failureCount = newFailureCount, successCount = 0)
            } else {
                copy(failureCount = newFailureCount, state = CircuitBreakerState.CLOSED)
            }
        }
        CircuitBreakerState.OPEN -> this
    }
}
