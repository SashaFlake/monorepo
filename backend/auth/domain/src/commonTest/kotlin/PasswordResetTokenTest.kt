import auth.model.passwordreset.PasswordResetToken
import auth.model.user.UserId
import io.kotest.core.spec.style.FunSpec
import io.kotest.matchers.shouldBe
import java.util.UUID

class PasswordResetTokenTest : FunSpec({
    val userId = UserId(UUID.randomUUID())

    context("isExpired") {
        test("token with future expiry is not expired") {
            val token = PasswordResetToken(
                token = "some-token",
                userId = userId,
                expiresAt = System.currentTimeMillis() + 10_000,
            )
            token.isExpired() shouldBe false
        }

        test("token with past expiry is expired") {
            val token = PasswordResetToken(
                token = "some-token",
                userId = userId,
                expiresAt = System.currentTimeMillis() - 10_000,
            )
            token.isExpired() shouldBe true
        }
    }
})
