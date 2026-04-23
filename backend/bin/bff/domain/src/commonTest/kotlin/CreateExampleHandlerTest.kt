import bff.command.CreateExampleCommand
import bff.command.CreateExampleHandler
import bff.model.Example
import bff.model.ExampleId
import bff.port.ExampleRepository
import bff.port.IdGenerator
import io.kotest.core.spec.style.FunSpec
import io.kotest.matchers.shouldBe
import io.mockk.coEvery
import io.mockk.mockk
import io.mockk.every
import java.util.UUID

class CreateExampleHandlerTest : FunSpec({
    val repository = mockk<ExampleRepository>()
    val idGenerator = mockk<IdGenerator>()
    val handler = CreateExampleHandler(repository, idGenerator)

    context("handle") {
        test("successful creation returns example") {
            val id = ExampleId(UUID.randomUUID())
            every { idGenerator.generate() } returns id
            coEvery { repository.save(any()) } returns Unit

            val result = handler.handle(CreateExampleCommand(name = "test"))

            result.isRight() shouldBe true
        }
    }
})
