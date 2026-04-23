package com.sashaflake.infrastructure.adapter

import mdmcore.model.Example
import mdmcore.model.ExampleId
import mdmcore.port.ExampleRepository
import java.util.concurrent.ConcurrentHashMap

class InMemoryExampleRepository : ExampleRepository {
    private val store = ConcurrentHashMap<String, Example>()

    override suspend fun save(example: Example) {
        store[example.id.value.toString()] = example
    }

    override suspend fun findById(id: ExampleId): Example? = store[id.value.toString()]
}
