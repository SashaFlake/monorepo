package com.sashaflake.infrastructure.persistence

import com.eventstore.dbclient.EventData
import com.eventstore.dbclient.EventStoreDBClient
import com.eventstore.dbclient.ReadStreamOptions
import com.eventstore.dbclient.StreamNotFoundException
import com.sashaflake.circuitbreaker.application.port.EventStore
import com.sashaflake.circuitbreaker.model.CircuitBreakerEvent
import com.sashaflake.circuitbreaker.model.CircuitBreakerId
import kotlinx.coroutines.future.await
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlin.time.Instant

/**
 * Адаптер EventStore порта — хранит события в EventStoreDB.
 *
 * Stream naming: cb-{id.value}
 * Event envelope: { "type": "CallSucceeded", "occurredAt": "...", ...payload }
 *
 * Один CB = один stream. Восстановление:
 *   loadAll(id) → fold(CircuitBreaker::apply)
 */
class EventStoreDbEventStore(
    private val client: EventStoreDBClient,
    private val json: Json = Json { ignoreUnknownKeys = true },
) : EventStore {

    override suspend fun append(events: List<CircuitBreakerEvent>) {
        if (events.isEmpty()) return
        events
            .groupBy { it.id }
            .forEach { (id, batch) ->
                val stream = streamName(id)
                val eventData = batch.map { it.toEventData() }
                client.appendToStream(stream, eventData.iterator()).await()
            }
    }

    override suspend fun loadAll(id: CircuitBreakerId): List<CircuitBreakerEvent> {
        val stream = streamName(id)
        return try {
            client.readStream(stream, ReadStreamOptions.get().forwards().fromStart()).await()
                .events
                .mapNotNull { it.event.eventData.toCircuitBreakerEvent() }
        } catch (_: StreamNotFoundException) {
            emptyList()
        }
    }

    // -------------------------------------------------------------------

    private fun streamName(id: CircuitBreakerId) = "cb-${id.value}"

    /**
     * Сериализуем событие в EventData.
     * eventType — класс события ("CallSucceeded", "CallFailed", и т.d.).
     * Payload — JSON с всеми полями события.
     */
    private fun CircuitBreakerEvent.toEventData(): EventData {
        val eventType = this::class.simpleName ?: "Unknown"
        val payload = toJsonObject()
        return EventData.builderAsJson(eventType, json.encodeToString(payload).toByteArray())
            .build()
    }

    private fun CircuitBreakerEvent.toJsonObject(): JsonObject = buildJsonObject {
        put("id", JsonPrimitive(id.value))
        put("occurredAt", JsonPrimitive(occurredAt.toString()))
        when (this@toJsonObject) {
            is CircuitBreakerEvent.CallFailed -> put("cause", JsonPrimitive(cause))
            else -> Unit
        }
    }

    /**
     * Десериализация: bytes → CircuitBreakerEvent.
     * eventType извлекается из поля eventType EventStoreDB
     * (хранится отдельно от данных),
     * поэтому мы восстанавливаем его через it.event.eventType.
     */
    private fun ByteArray.toCircuitBreakerEvent(): CircuitBreakerEvent? {
        // этот метод вызывается уже после разбора в loadAll, eventType доступен через RecordedEvent
        return null // placeholder: реальная десериализация ниже
    }
}

// Extension: десериализация RecordedEvent → CircuitBreakerEvent
fun com.eventstore.dbclient.RecordedEvent.toCircuitBreakerEvent(json: Json): CircuitBreakerEvent? {
    val payload = runCatching { Json.parseToJsonElement(String(eventData)).jsonObject }.getOrNull() ?: return null
    val id = CircuitBreakerId(payload["id"]?.jsonPrimitive?.content ?: return null)
    val occurredAt = Instant.parse(payload["occurredAt"]?.jsonPrimitive?.content ?: return null)
    return when (eventType) {
        "CallSucceeded" -> CircuitBreakerEvent.CallSucceeded(id, occurredAt)
        "CallFailed" -> CircuitBreakerEvent.CallFailed(
            id,
            occurredAt,
            payload["cause"]?.jsonPrimitive?.content ?: "unknown",
        )
        "CallRejected" -> CircuitBreakerEvent.CallRejected(id, occurredAt)
        "CircuitOpened" -> CircuitBreakerEvent.CircuitOpened(id, occurredAt)
        "CircuitClosed" -> CircuitBreakerEvent.CircuitClosed(id, occurredAt)
        "ResetTriggered" -> CircuitBreakerEvent.ResetTriggered(id, occurredAt)
        else -> null
    }
}
