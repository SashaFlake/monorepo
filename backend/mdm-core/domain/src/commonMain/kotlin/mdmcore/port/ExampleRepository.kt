package mdmcore.port

import mdmcore.model.Example
import mdmcore.model.ExampleId

interface ExampleRepository {
    suspend fun save(example: Example)
    suspend fun findById(id: ExampleId): Example?
}
