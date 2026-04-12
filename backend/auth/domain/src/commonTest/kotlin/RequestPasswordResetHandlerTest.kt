import auth.command.RequestPasswordResetCommand
import auth.command.RequestPasswordResetHandler
import auth.model.passwordreset.PasswordResetToken
import auth.model.user.Email
import auth.model.user.HashedPassword
import auth.model.user.LoginAttemptGuard
import auth.model.user.User
import auth.model.user.UserId
import auth.port.EmailSender
import auth.port.PasswordResetTokenGenerator
import auth.port.PasswordResetTokenRepository
import auth.port.UserRepository
import io.kotest.core.spec.style.FunSpec
import io.kotest.matchers.shouldBe
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import java.util.UUID

class RequestPasswordResetHandlerTest : FunSpec({
    val userRepository = mockk<UserRepository>()
    val passwordResetTokenRepository = mockk<PasswordResetTokenRepository>()
    val passwordResetTokenGenerator = mockk<PasswordResetTokenGenerator>()
    val emailSender = mockk<EmailSender>()
    val handler = RequestPasswordResetHandler(
        userRepository,
        passwordResetTokenRepository,
        passwordResetTokenGenerator,
        emailSender,
    )

    val userId = UserId(UUID.randomUUID())
    val email = Email.of("test@example.com").getOrNull()!!
    val user = User(
        id = userId,
        email = email,
        password = HashedPassword.fromTrustedSource("hashedPassword1234567890123456789012345678901234567890"),
        loginAttemptGuard = LoginAttemptGuard.initial(),
    )

    context("handle") {
        test("successful request sends email and saves token") {
            val token = PasswordResetToken(
                token = "reset-token-123",
                userId = userId,
                expiresAt = System.currentTimeMillis() + 3_600_000,
            )

            coEvery { userRepository.findByEmail(email) } returns user
            every { passwordResetTokenGenerator.generate(userId) } returns token
            coEvery { passwordResetTokenRepository.save(token) } returns Unit
            coEvery { emailSender.send(email, any(), any()) } returns Unit

            val result = handler.handle(RequestPasswordResetCommand("test@example.com"))

            result.isRight() shouldBe true
            coVerify { passwordResetTokenRepository.save(token) }
            coVerify { emailSender.send(email, any(), any()) }
        }

        test("user not found returns UserNotFound error") {
            coEvery { userRepository.findByEmail(email) } returns null

            val result = handler.handle(RequestPasswordResetCommand("test@example.com"))

            result.isLeft() shouldBe true
            result.leftOrNull() shouldBe RequestPasswordResetHandler.Error.UserNotFound
        }

        test("invalid email format returns UserNotFound error") {
            val result = handler.handle(RequestPasswordResetCommand("not-an-email"))

            result.isLeft() shouldBe true
            result.leftOrNull() shouldBe RequestPasswordResetHandler.Error.UserNotFound
        }
    }
})
