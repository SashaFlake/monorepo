package com.sashaflake.infrastructure.actor

import com.sashaflake.circuitbreaker.model.CircuitBreakerConfig
import com.sashaflake.circuitbreaker.model.CircuitBreakerId
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.channels.SendChannel

/**
 * Реестр акторов: один актор на каждый [CircuitBreakerId].
 * Акторы создаются лениво при первом обращении.
 *
 * Живёт как singleton в Koin-контейнере и владеет собственным [CoroutineScope]
 * с [SupervisorJob] — падение одного актора не роняет остальные.
 */
class CircuitBreakerRegistry(
    private val defaultConfig: CircuitBreakerConfig = CircuitBreakerConfig(),
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private val actors = mutableMapOf<CircuitBreakerId, SendChannel<CircuitBreakerMessage>>()

    /**
     * Возвращает канал актора для заданного [id].
     * Если актора ещё нет — создаёт его.
     */
    @Synchronized
    fun getOrCreate(
        id: CircuitBreakerId,
        config: CircuitBreakerConfig = defaultConfig,
    ): SendChannel<CircuitBreakerMessage> =
        actors.getOrPut(id) {
            scope.circuitBreakerActor(id, config)
        }
}
