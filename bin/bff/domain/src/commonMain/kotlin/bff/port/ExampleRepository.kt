package bff.port

import bff.model.Example
import bff.model.ExampleId

interface ExampleRepository {
    suspend fun save(example: Example)
    suspend fun findById(id: ExampleId): Example?
}
