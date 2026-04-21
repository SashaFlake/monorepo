package com.sashaflake.infrastructure.actor

import com.sashaflake.circuitbreaker.application.port.EventStore
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
 * Архитектура (Elm Architecture + Event Sourcing):
 *   Message -> reduce() -> (State, List<Effect>, List<Event>)
 *           -> interpret() [IO: persist events, run blocks, schedule timers]
 *
 * Восстановление после рестарта:
 *   eventStore.loadAll(id) -> events.fold(initial) { cb, e -> cb.apply(e) }
 */
@Suppress("OPT_IN_USAGE")
fun CoroutineScope.circuitBreakerActor(
    id: CircuitBreakerId,
    config: CircuitBreakerConfig = CircuitBreakerConfig(),
    eventStore: EventStore,
): SendChannel<CircuitBreakerMessage> = actor {

    // Восстанавливаем состояние из истории событий
    val initial = eventStore
        .loadAll(id)
        .fold(CircuitBreaker(id = id, config = config)) { cb, event -> cb.apply(event) }

    tailrec suspend fun loop(cb: CircuitBreaker) {
        val msg = channel.receiveCatching().getOrNull() ?: return
        val (next, effects, events) = cb.reduce(msg)
        if (events.isNotEmpty()) {
            interpret(CircuitBreakerEffect.StoreEvents(events), channel, eventStore, this@actor)
        }
        effects.forEach { interpret(it, channel, eventStore, this@actor) }
        loop(next)
    }

    loop(initial)
}

/**
 * Интерпретатор эффектов — единственное место, где происходит IO.
 */
private suspend fun interpret(
    effect: CircuitBreakerEffect,
    channel: SendChannel<CircuitBreakerMessage>,
    eventStore: EventStore,
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

        is CircuitBreakerEffect.StoreEvents ->
            eventStore.append(effect.events)

        is Log.Info -> log.info("[{}] {}", effect.id.value, effect.message)
        is Log.Warn -> log.warn("[{}] {}", effect.id.value, effect.message)
    }
}
