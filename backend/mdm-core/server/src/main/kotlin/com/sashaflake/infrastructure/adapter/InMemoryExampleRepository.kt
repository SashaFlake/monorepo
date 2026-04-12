package com.sashaflake.infrastructure.adapter

import __PACKAGE__.model.Example
import __PACKAGE__.model.ExampleId
import __PACKAGE__.port.ExampleRepository
import java.util.concurrent.ConcurrentHashMap

// Заглушка для тестов / локальной разработки.
// В prod замени на DragonflyExampleRepository или PostgresExampleRepository.
class InMemoryExampleRepository : ExampleRepository {
    private val store = ConcurrentHashMap<String, Example>()

    override suspend fun save(example: Example) {
        store[example.id.value.toString()] = example
    }

    override suspend fun findById(id: ExampleId): Example? = store[id.value.toString()]
}
