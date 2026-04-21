package com.sashaflake.presentation

import com.sashaflake.circuitbreaker.model.CallResult
import com.sashaflake.circuitbreaker.model.CircuitBreakerId
import com.sashaflake.infrastructure.actor.CircuitBreakerMessage
import com.sashaflake.infrastructure.actor.CircuitBreakerRegistry
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.delay
import kotlinx.serialization.Serializable
import kotlin.random.Random

/**
 * Прикладной хендлер: принимает HTTP-запрос, прогоняет "вызов к внешнему сервису"
 * через нужный Circuit Breaker из реестра.
 */
class CircuitBreakerHandler(private val registry: CircuitBreakerRegistry) {

    @Serializable
    data class CallRequest(val serviceId: String)

    @Serializable
    data class CallResponse(val serviceId: String, val result: String, val detail: String? = null)

    suspend fun call(request: CallRequest): CallResponse {
        val id = CircuitBreakerId(request.serviceId)
        val actor = registry.getOrCreate(id)
        val reply = CompletableDeferred<CallResult>()

        actor.send(
            CircuitBreakerMessage.Execute(
                block = { fakeExternalCall(request.serviceId) },
                reply = reply,
            ),
        )

        return when (val result = reply.await()) {
            CallResult.Success -> CallResponse(request.serviceId, "SUCCESS")
            CallResult.Rejected -> CallResponse(request.serviceId, "REJECTED", "Circuit is OPEN")
            is CallResult.Failure -> CallResponse(request.serviceId, "FAILURE", result.cause.message)
        }
    }

    /**
     * Симуляция нестабильного внешнего сервиса:
     * - случайно падает с вероятностью 60%
     * - добавляет небольшую задержку
     */
    private suspend fun fakeExternalCall(serviceId: String) {
        delay(Random.nextLong(50, 200))
        if (Random.nextDouble() < 0.6) {
            error("External service '$serviceId' is unavailable")
        }
    }
}
