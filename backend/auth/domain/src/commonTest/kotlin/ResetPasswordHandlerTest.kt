import auth.command.ResetPasswordCommand
import auth.command.ResetPasswordHandler
import auth.model.passwordreset.PasswordResetToken
import auth.model.user.Email
import auth.model.user.HashedPassword
import auth.model.user.LoginAttemptGuard
import auth.model.user.User
import auth.model.user.UserId
import auth.port.PasswordHasher
import auth.port.PasswordResetTokenRepository
import auth.port.UserRepository
import io.kotest.core.spec.style.FunSpec
import io.kotest.matchers.shouldBe
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import java.util.UUID

class ResetPasswordHandlerTest : FunSpec({
    val userRepository = mockk<UserRepository>()
    val passwordResetTokenRepository = mockk<PasswordResetTokenRepository>()
    val passwordHasher = mockk<PasswordHasher>()
    val handler = ResetPasswordHandler(userRepository, passwordResetTokenRepository, passwordHasher)

    val userId = UserId(UUID.randomUUID())
    val email = Email.of("test@example.com").getOrNull()!!
    val user = User(
        id = userId,
        email = email,
        password = HashedPassword.fromTrustedSource("oldHashedPassword12345678901234567890123456789012345"),
        loginAttemptGuard = LoginAttemptGuard.initial(),
    )
    val validToken = PasswordResetToken(
        token = "valid-reset-token",
        userId = userId,
        expiresAt = System.currentTimeMillis() + 3_600_000,
    )

    context("handle") {
        test("successful password reset returns Unit") {
            val newHashedPassword = HashedPassword.fromTrustedSource("newHashedPassword12345678901234567890123456789012345")

            coEvery { passwordResetTokenRepository.findByToken("valid-reset-token") } returns validToken
            coEvery { userRepository.findById(userId) } returns user
            every { passwordHasher.hash(any()) } returns newHashedPassword
            coEvery { userRepository.save(any()) } returns Unit
            coEvery { passwordResetTokenRepository.delete("valid-reset-token") } returns Unit

            val result = handler.handle(ResetPasswordCommand("valid-reset-token", "newPassword123"))

            result.isRight() shouldBe true
            coVerify { userRepository.save(match { it.password == newHashedPassword }) }
            coVerify { passwordResetTokenRepository.delete("valid-reset-token") }
        }

        test("token not found returns TokenNotFound error") {
            coEvery { passwordResetTokenRepository.findByToken("invalid-token") } returns null

            val result = handler.handle(ResetPasswordCommand("invalid-token", "newPassword123"))

            result.isLeft() shouldBe true
            result.leftOrNull() shouldBe ResetPasswordHandler.Error.TokenNotFound
        }

        test("expired token returns TokenExpired error") {
            val expiredToken = validToken.copy(expiresAt = System.currentTimeMillis() - 10_000)
            coEvery { passwordResetTokenRepository.findByToken("valid-reset-token") } returns expiredToken

            val result = handler.handle(ResetPasswordCommand("valid-reset-token", "newPassword123"))

            result.isLeft() shouldBe true
            result.leftOrNull() shouldBe ResetPasswordHandler.Error.TokenExpired
        }

        test("user not found returns UserNotFound error") {
            coEvery { passwordResetTokenRepository.findByToken("valid-reset-token") } returns validToken
            coEvery { userRepository.findById(userId) } returns null

            val result = handler.handle(ResetPasswordCommand("valid-reset-token", "newPassword123"))

            result.isLeft() shouldBe true
            result.leftOrNull() shouldBe ResetPasswordHandler.Error.UserNotFound
        }

        test("short password returns InvalidPassword error") {
            coEvery { passwordResetTokenRepository.findByToken("valid-reset-token") } returns validToken
            coEvery { userRepository.findById(userId) } returns user

            val result = handler.handle(ResetPasswordCommand("valid-reset-token", "short"))

            result.isLeft() shouldBe true
            result.leftOrNull() shouldBe ResetPasswordHandler.Error.InvalidPassword
        }
    }
})
