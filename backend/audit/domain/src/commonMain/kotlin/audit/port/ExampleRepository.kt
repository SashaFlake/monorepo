package audit.port

import audit.model.Example
import audit.model.ExampleId

// Порт — интерфейс, реализуется в server/infrastructure/adapter/
interface ExampleRepository {
    suspend fun save(example: Example)
    suspend fun findById(id: ExampleId): Example?
    // TODO: добавить методы
}
