package com.sashaflake.infrastructure.actor

import com.sashaflake.circuitbreaker.application.port.EventStore
import com.sashaflake.circuitbreaker.model.CircuitBreakerConfig
import com.sashaflake.circuitbreaker.model.CircuitBreakerId
import com.sashaflake.circuitbreaker.model.CircuitBreakerMessage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.channels.SendChannel
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/**
 * Реестр акторов: один актор на каждый [CircuitBreakerId].
 * Акторы создаются лениво при первом обращении.
 *
 * Живёт как singleton в Koin-контейнере и владеет собственным [CoroutineScope]
 * с [SupervisorJob] — падение одного актора не роняет остальные.
 *
 * [Mutex] вместо @Synchronized: suspend вместо блокировки потока.
 * Подмьютексная операция — простой map lookup + редкое создание актора.
 */
class CircuitBreakerRegistry(
    private val defaultConfig: CircuitBreakerConfig = CircuitBreakerConfig(),
    private val eventStore: EventStore,
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private val mutex = Mutex()
    private val actors = mutableMapOf<CircuitBreakerId, SendChannel<CircuitBreakerMessage>>()

    /**
     * Возвращает канал актора для заданного [id].
     * Если актора ещё нет — создаёт его.
     */
    suspend fun getOrCreate(
        id: CircuitBreakerId,
        config: CircuitBreakerConfig = defaultConfig,
    ): SendChannel<CircuitBreakerMessage> = mutex.withLock {
        actors.getOrPut(id) {
            scope.circuitBreakerActor(id, config, eventStore)
        }
    }
}
