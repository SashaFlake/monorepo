package com.sashaflake.circuitbreaker.application.port

import com.sashaflake.circuitbreaker.model.CircuitBreakerEvent
import com.sashaflake.circuitbreaker.model.CircuitBreakerId

/**
 * Порт — append-only хранилище событий.
 *
 * Состояние CB = events.fold(initial) { cb, e -> cb.apply(e) }
 * Все операции suspend — любая персистентность это IO.
 */
interface EventStore {
    suspend fun append(events: List<CircuitBreakerEvent>)
    suspend fun loadAll(id: CircuitBreakerId): List<CircuitBreakerEvent>
}
