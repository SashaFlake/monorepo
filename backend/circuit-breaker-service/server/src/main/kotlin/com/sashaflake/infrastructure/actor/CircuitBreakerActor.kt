package com.sashaflake.infrastructure.actor

import com.sashaflake.circuitbreaker.model.CallResult
import com.sashaflake.circuitbreaker.model.CircuitBreaker
import com.sashaflake.circuitbreaker.model.CircuitBreakerConfig
import com.sashaflake.circuitbreaker.model.CircuitBreakerId
import com.sashaflake.circuitbreaker.model.CircuitBreakerState
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
 * Всё состояние [CircuitBreaker] живёт исключительно внутри корутины актора —
 * никаких мьютексов, никакого shared mutable state снаружи.
 */
@Suppress("OPT_IN_USAGE") // actor{} — experimental API, но стабилен на практике
fun CoroutineScope.circuitBreakerActor(
    id: CircuitBreakerId,
    config: CircuitBreakerConfig = CircuitBreakerConfig(),
): SendChannel<CircuitBreakerMessage> = actor {
    var cb = CircuitBreaker(id = id, config = config)

    for (msg in channel) {
        when (msg) {
            // ------------------------------------------------------------------
            // Execute: клиент хочет выполнить вызов
            // ------------------------------------------------------------------
            is CircuitBreakerMessage.Execute -> {
                if (!cb.isCallAllowed()) {
                    log.warn("[{}] OPEN — rejecting call", id.value)
                    msg.reply.complete(CallResult.Rejected)
                    continue
                }

                val result = runCatching { msg.block() }.fold(
                    onSuccess = { CallResult.Success },
                    onFailure = { CallResult.Failure(it) },
                )

                cb = cb.recordResult(result)
                log.info("[{}] state={} failures={}", id.value, cb.state, cb.failureCount)

                // Если только что открылись — взводим таймер сброса
                if (cb.state == CircuitBreakerState.OPEN) {
                    launch {
                        delay(config.resetTimeout)
                        channel.send(CircuitBreakerMessage.TryReset)
                    }
                }

                msg.reply.complete(result)
            }

            // ------------------------------------------------------------------
            // TryReset: таймер истёк, переводим OPEN → HALF_OPEN
            // ------------------------------------------------------------------
            CircuitBreakerMessage.TryReset -> {
                cb = cb.tryReset()
                log.info("[{}] reset → state={}", id.value, cb.state)
            }
        }
    }
}
