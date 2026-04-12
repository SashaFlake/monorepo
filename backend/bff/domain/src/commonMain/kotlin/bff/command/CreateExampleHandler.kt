package bff.command

import arrow.core.Either
import arrow.core.right
import bff.model.Example
import bff.model.ExampleId
import bff.port.ExampleRepository
import bff.port.IdGenerator

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
