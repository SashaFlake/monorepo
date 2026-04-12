import audit.command.CreateExampleCommand
import audit.command.CreateExampleHandler
import audit.model.Example
import audit.model.ExampleId
import audit.port.ExampleRepository
import audit.port.IdGenerator
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

        // TODO: добавить тесты на ошибки
    }
})
