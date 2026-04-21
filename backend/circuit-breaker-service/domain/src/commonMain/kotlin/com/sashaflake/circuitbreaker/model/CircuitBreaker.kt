package com.sashaflake.circuitbreaker.model

/**
 * Aggregate root — состояние Circuit Breaker.
 * Чистая доменная модель без side-effects: все переходы — чистые функции.
 */
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
        CircuitBreakerState.HALF_OPEN -> true   // один пробный вызов
        CircuitBreakerState.OPEN -> false
    }

    /** Применяем результат вызова и получаем новое состояние агрегата. */
    fun recordResult(result: CallResult): CircuitBreaker = when (result) {
        is CallResult.Success -> onSuccess()
        is CallResult.Failure -> onFailure()
        is CallResult.Rejected -> this
    }

    /** Таймер истёк — пробуем перейти из OPEN в HALF_OPEN. */
    fun tryReset(): CircuitBreaker = when (state) {
        CircuitBreakerState.OPEN -> copy(
            state = CircuitBreakerState.HALF_OPEN,
            failureCount = 0,
            successCount = 0,
        )
        else -> this
    }

    // -------------------------------------------------------------------

    private fun onSuccess(): CircuitBreaker = when (state) {
        CircuitBreakerState.HALF_OPEN -> {
            val newSuccessCount = successCount + 1
            if (newSuccessCount >= config.successThreshold) {
                copy(
                    state = CircuitBreakerState.CLOSED,
                    failureCount = 0,
                    successCount = 0,
                )
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
                copy(
                    state = CircuitBreakerState.OPEN,
                    failureCount = newFailureCount,
                    successCount = 0,
                )
            } else {
                copy(failureCount = newFailureCount, state = CircuitBreakerState.CLOSED)
            }
        }
        CircuitBreakerState.OPEN -> this
    }
}
