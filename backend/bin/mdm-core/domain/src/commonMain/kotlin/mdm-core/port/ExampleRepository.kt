package __PACKAGE__.port

import __PACKAGE__.model.Example
import __PACKAGE__.model.ExampleId

// Порт — интерфейс, реализуется в server/infrastructure/adapter/
interface ExampleRepository {
    suspend fun save(example: Example)
    suspend fun findById(id: ExampleId): Example?
    // TODO: добавить методы
}
