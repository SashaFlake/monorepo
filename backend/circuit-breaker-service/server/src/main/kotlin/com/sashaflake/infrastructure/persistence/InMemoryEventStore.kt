package com.sashaflake.infrastructure.persistence

import com.sashaflake.circuitbreaker.application.port.EventStore
import com.sashaflake.circuitbreaker.model.CircuitBreakerEvent
import com.sashaflake.circuitbreaker.model.CircuitBreakerId
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/**
 * In-memory реализация EventStore.
 * События живут в памяти, сбрасываются при рестарте процесса.
 * Достаточно для одного пода, легко заменяется на Redis Streams / EventStoreDB.
 */
class InMemoryEventStore : EventStore {
    private val mutex = Mutex()
    private val store = mutableMapOf<CircuitBreakerId, MutableList<CircuitBreakerEvent>>()

    override suspend fun append(events: List<CircuitBreakerEvent>) {
        if (events.isEmpty()) return
        mutex.withLock {
            events.forEach { event ->
                store.getOrPut(event.id) { mutableListOf() }.add(event)
            }
        }
    }

    override suspend fun loadAll(id: CircuitBreakerId): List<CircuitBreakerEvent> =
        mutex.withLock { store[id]?.toList() ?: emptyList() }
}
