import auth.model.user.Email
import io.kotest.core.spec.style.FunSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.types.shouldBeInstanceOf

class EmailTest : FunSpec({
    context("Email.of") {
        test("valid email returns Right") {
            val result = Email.of("user@example.com")
            result.isRight() shouldBe true
        }

        test("email without @ returns Left") {
            val result = Email.of("invalidemail")
            result.isLeft() shouldBe true
        }

        test("email without domain returns Left") {
            val result = Email.of("user@")
            result.isLeft() shouldBe true
        }

        test("email without local part returns Left") {
            val result = Email.of("@example.com")
            result.isLeft() shouldBe true
        }

        test("email with subdomain is valid") {
            val result = Email.of("user@mail.example.com")
            result.isRight() shouldBe true
        }

        test("empty string returns Left") {
            val result = Email.of("")
            result.isLeft() shouldBe true
        }
    }
})
