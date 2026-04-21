package com.sashaflake.circuitbreaker.application.port

import com.sashaflake.circuitbreaker.model.CircuitBreaker
import com.sashaflake.circuitbreaker.model.CircuitBreakerId

/**
 * Порт — абстракция хранилища Circuit Breaker.
 * Domain-agnostic: не знает ни о базах данных, ни о сети.
 * Все операции — suspend, потому что любая персистентность — это IO.
 */
interface CircuitBreakerRepository {
    suspend fun findById(id: CircuitBreakerId): CircuitBreaker?
    suspend fun save(cb: CircuitBreaker): CircuitBreaker
    suspend fun findAll(): List<CircuitBreaker>
}
