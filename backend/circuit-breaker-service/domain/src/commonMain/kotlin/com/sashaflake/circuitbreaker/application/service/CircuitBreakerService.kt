package com.sashaflake.circuitbreaker.application.service

import com.sashaflake.circuitbreaker.application.port.CircuitBreakerRepository
import com.sashaflake.circuitbreaker.model.CallResult
import com.sashaflake.circuitbreaker.model.CircuitBreaker
import com.sashaflake.circuitbreaker.model.CircuitBreakerConfig
import com.sashaflake.circuitbreaker.model.CircuitBreakerId

/**
 * Application service — оркестрирует доменную логику и IO.
 *
 * FP-принципы:
 * - все публичные функции возвращают Result<T> — нет throws в сигнатуре
 * - доменные переходы делегируются чистым функциям модели
 * - suspend только на границах IO (repository)
 * - service stateless — состояние живёт исключительно в repository
 */
class CircuitBreakerService(
    private val repository: CircuitBreakerRepository,
) {

    /**
     * Создать новый Circuit Breaker с заданной конфигурацией.
     */
    suspend fun create(
        id: CircuitBreakerId,
        config: CircuitBreakerConfig = CircuitBreakerConfig(),
    ): Result<CircuitBreaker> = runCatching {
        val existing = repository.findById(id)
        require(existing == null) { "CircuitBreaker '${id.value}' already exists" }
        repository.save(CircuitBreaker(id = id, config = config))
    }

    /**
     * Выполнить вызов через Circuit Breaker с безопасным Either-style результатом.
     *
     * Паттерн:
     * 1. Читаем текущее состояние (IO)
     * 2. Проверяем isCallAllowed() — чистая доменная логика
     * 3. OPEN → сохраняем Rejected, возвращаем CallOutcome.Rejected
     * 4. Выполняем [block] (suspend IO)
     * 5. Записываем результат через чистую domain-функцию → сохраняем (IO)
     */
    suspend fun <T> call(
        id: CircuitBreakerId,
        block: suspend () -> T,
    ): CallOutcome<T> {
        val cb = repository.findById(id)
            ?: return CallOutcome.Failed(
                cause = NoSuchElementException("CircuitBreaker '${id.value}' not found"),
                cb = CircuitBreaker(id = id, config = CircuitBreakerConfig()),
            )

        if (!cb.isCallAllowed()) {
            val updated = repository.save(cb.recordResult(CallResult.Rejected))
            return CallOutcome.Rejected(updated)
        }

        return runCatching { block() }.fold(
            onSuccess = { value ->
                val updated = repository.save(cb.recordResult(CallResult.Success))
                CallOutcome.Success(value, updated)
            },
            onFailure = { cause ->
                val updated = repository.save(cb.recordResult(CallResult.Failure(cause)))
                CallOutcome.Failed(cause, updated)
            },
        )
    }

    /**
     * Явно уведомить CB о результате вызова (для случаев вне [call]).
     */
    suspend fun recordResult(
        id: CircuitBreakerId,
        result: CallResult,
    ): Result<CircuitBreaker> = runCatching {
        val cb = repository.findById(id)
            ?: error("CircuitBreaker '${id.value}' not found")
        repository.save(cb.recordResult(result))
    }

    /**
     * Попытка сброса таймера (OPEN → HALF_OPEN).
     * Вызывается планировщиком или внешним триггером по истечении resetTimeout.
     */
    suspend fun tryReset(id: CircuitBreakerId): Result<CircuitBreaker> = runCatching {
        val cb = repository.findById(id)
            ?: error("CircuitBreaker '${id.value}' not found")
        repository.save(cb.tryReset())
    }

    /**
     * Получить текущее состояние Circuit Breaker.
     */
    suspend fun get(id: CircuitBreakerId): Result<CircuitBreaker> = runCatching {
        repository.findById(id)
            ?: error("CircuitBreaker '${id.value}' not found")
    }
}
