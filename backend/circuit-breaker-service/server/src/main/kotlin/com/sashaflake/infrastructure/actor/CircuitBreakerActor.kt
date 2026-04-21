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
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.slf4j.LoggerFactory

private val log = LoggerFactory.getLogger("CircuitBreakerActor")

/**
 * Запускает актор для одного Circuit Breaker и возвращает его канал.
 *
 * Архитектура (Elm Architecture):
 *   Message -> reduce() -> (State, List<Effect>) -> interpret()
 *
 * - Никакого var, никакого for-loop
 * - tail-recursive loop: компилятор разворачивает в обычный цикл, стек не растёт
 * - reduce() — чистая функция, тестируется без корутин
 * - interpret() — единственное место с реальным IO
 */
@Suppress("OPT_IN_USAGE")
fun CoroutineScope.circuitBreakerActor(
    id: CircuitBreakerId,
    config: CircuitBreakerConfig = CircuitBreakerConfig(),
): SendChannel<CircuitBreakerMessage> = actor {

    tailrec suspend fun loop(cb: CircuitBreaker) {
        val msg = channel.receiveCatching().getOrNull() ?: return
        val (next, effects) = cb.reduce(msg)
        effects.forEach { interpret(it, channel, this@actor) }
        loop(next)
    }

    loop(CircuitBreaker(id = id, config = config))
}

/**
 * Интерпретатор эффектов — единственное место, где происходит IO.
 *
 * when как statement (без =): нет проблемы с несовпадением типов ветвей,
 * при этом exhaustiveness по sealed interface всё равно гарантируется компилятором.
 */
private suspend fun interpret(
    effect: CircuitBreakerEffect,
    channel: SendChannel<CircuitBreakerMessage>,
    scope: CoroutineScope,
) {
    when (effect) {
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
            }

        is Log.Info -> log.info("[{}] {}", effect.id.value, effect.message)
        is Log.Warn -> log.warn("[{}] {}", effect.id.value, effect.message)
    }
}
