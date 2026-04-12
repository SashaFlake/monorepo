package compliance.command

import arrow.core.Either
import arrow.core.right
import compliance.model.Example
import compliance.model.ExampleId
import compliance.port.ExampleRepository
import compliance.port.IdGenerator

class CreateExampleHandler(
    private val exampleRepository: ExampleRepository,
    private val idGenerator: IdGenerator,
) {
    sealed class Error {
        data object AlreadyExists : Error()
    }

    suspend fun handle(command: CreateExampleCommand): Either<Error, Example> {
        val id = idGenerator.generate()
        val example = Example(id = id)
        exampleRepository.save(example)
        return example.right()
    }
}
