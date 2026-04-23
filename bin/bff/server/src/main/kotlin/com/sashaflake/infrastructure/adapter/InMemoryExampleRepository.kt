package com.sashaflake.infrastructure.adapter

import bff.model.Example
import bff.model.ExampleId
import bff.port.ExampleRepository
import java.util.concurrent.ConcurrentHashMap

class InMemoryExampleRepository : ExampleRepository {
    private val store = ConcurrentHashMap<String, Example>()

    override suspend fun save(example: Example) {
        store[example.id.value.toString()] = example
    }

    override suspend fun findById(id: ExampleId): Example? = store[id.value.toString()]
}
