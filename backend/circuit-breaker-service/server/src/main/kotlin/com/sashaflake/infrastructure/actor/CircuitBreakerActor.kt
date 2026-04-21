package com.sashaflake.infrastructure.actor

import com.sashaflake.circuitbreaker.model.CallResult
import com.sashaflake.circuitbreaker.model.CircuitBreaker
import com.sashaflake.circuitbreaker.model.CircuitBreakerConfig
import com.sashaflake.circuitbreaker.model.CircuitBreakerEffect
import com.sashaflake.circuitbreaker.model.CircuitBreakerEffect.Log
import com.sashaflake.circuitbreaker.model.CircuitBreakerMessage
import com.sashaflake.circuitbreaker.model.CircuitBreakerId
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.channels.SendChannel
import kotlinx.coroutines.channels.actor
import kotlinx.coroutines.channels.consumeAsFlow
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.runningFold
import kotlinx.coroutines.launch
import org.slf4j.LoggerFactory

private val log = LoggerFactory.getLogger("CircuitBreakerActor")

/**
 * Запускает актор для одного Circuit Breaker и возвращает его канал.
 *
 * Архитектура (Elm-style):
 *   Message → reduce() [pure] → (State, List<Effect>) → interpret() [IO]
 *
 * - Никакого var, никакого for-loop
 * - reduce() — чистая функция, тестируется без корутин
 * - interpret() — единственное место с реальным IO
 */
@Suppress("OPT_IN_USAGE")
fun CoroutineScope.circuitBreakerActor(
    id: CircuitBreakerId,
    config: CircuitBreakerConfig = CircuitBreakerConfig(),
): SendChannel<CircuitBreakerMessage> = actor {
    channel
        .consumeAsFlow()
        .runningFold(CircuitBreaker(id = id, config = config)) { cb, msg ->
            val (next, effects) = cb.reduce(msg)
            effects.forEach { interpret(it, channel, this@actor) }
            next
        }
        .collect {}
}

/**
 * Интерпретатор эффектов — единственное место, где происходит IO.
 * Чистый when по sealed interface: компилятор гарантирует полноту.
 */
private suspend fun interpret(
    effect: CircuitBreakerEffect,
    channel: SendChannel<CircuitBreakerMessage>,
    scope: CoroutineScope,
): Unit = when (effect) {
    is CircuitBreakerEffect.RunBlock -> {
        val result = runCatching { effect.block() }.fold(
            onSuccess = { CallResult.Success },
            onFailure = { CallResult.Failure(it) },
        )
        channel.send(CircuitBreakerMessage.BlockResult(result, effect.reply))
    }

    is CircuitBreakerEffect.CompleteReply ->
        effect.reply.complete(effect.result)

    is CircuitBreakerEffect.ScheduleReset ->
        scope.launch {
            delay(effect.delay)
            channel.send(CircuitBreakerMessage.TryReset)
        }.let {}

    is Log.Info -> log.info("[{}] {}", effect.id.value, effect.message)
    is Log.Warn -> log.warn("[{}] {}", effect.id.value, effect.message)
}
