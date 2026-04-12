package compliance.port

import compliance.model.Example
import compliance.model.ExampleId

interface ExampleRepository {
    suspend fun save(example: Example)
    suspend fun findById(id: ExampleId): Example?
}
