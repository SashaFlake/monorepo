package audit.command

import arrow.core.Either
import arrow.core.left
import arrow.core.right
import audit.model.Example
import audit.model.ExampleId
import audit.port.ExampleRepository
import audit.port.IdGenerator

// Хендлер — use-case. Возвращает Either<Error, Result>
class CreateExampleHandler(
    private val exampleRepository: ExampleRepository,
    private val idGenerator: IdGenerator,
) {
    sealed class Error {
        // TODO: добавить бизнес-ошибки
        data object AlreadyExists : Error()
    }

    suspend fun handle(command: CreateExampleCommand): Either<Error, Example> {
        // TODO: реализовать логику
        val id = idGenerator.generate()
        val example = Example(id = id)
        exampleRepository.save(example)
        return example.right()
    }
}
