import compliance.command.CreateExampleCommand
import compliance.command.CreateExampleHandler
import compliance.model.Example
import compliance.model.ExampleId
import compliance.port.ExampleRepository
import compliance.port.IdGenerator
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
