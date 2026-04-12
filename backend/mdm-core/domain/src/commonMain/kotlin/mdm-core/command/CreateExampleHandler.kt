package __PACKAGE__.command

import arrow.core.Either
import arrow.core.left
import arrow.core.right
import __PACKAGE__.model.Example
import __PACKAGE__.model.ExampleId
import __PACKAGE__.port.ExampleRepository
import __PACKAGE__.port.IdGenerator

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
