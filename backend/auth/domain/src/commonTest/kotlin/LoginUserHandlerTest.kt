import auth.command.LoginUserCommand
import auth.command.LoginUserHandler
import auth.model.user.Email
import auth.model.user.HashedPassword
import auth.model.user.LoginAttemptGuard
import auth.model.user.PlainPassword
import auth.model.user.User
import auth.model.user.UserId
import auth.port.PasswordHasher
import auth.port.TokenIssuer
import auth.port.UserRepository
import io.kotest.core.spec.style.FunSpec
import io.kotest.matchers.shouldBe
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import java.util.UUID

class LoginUserHandlerTest : FunSpec({
    val userRepository = mockk<UserRepository>()
    val passwordHasher = mockk<PasswordHasher>()
    val tokenIssuer = mockk<TokenIssuer>()
    val handler = LoginUserHandler(userRepository, passwordHasher, tokenIssuer)

    val email = Email.of("test@example.com").getOrNull()!!
    val hashedPassword = HashedPassword.fromTrustedSource("hashedPassword1234567890123456789012345678901234567890")
    val userId = UserId(UUID.randomUUID())
    val user = User(userId, email, hashedPassword, LoginAttemptGuard.initial())

    context("handle") {
        test("successful login returns token") {
            coEvery { userRepository.findByEmail(email) } returns user
            every { passwordHasher.verify(any(), any()) } returns true
            every { tokenIssuer.issue(userId) } returns "token123"
            coEvery { userRepository.save(any()) } returns Unit

            val result = handler.handle(LoginUserCommand("test@example.com", "password123"))

            result.isRight() shouldBe true
            result.getOrNull() shouldBe "token123"
        }

        test("user not found returns UserNotFound error") {
            coEvery { userRepository.findByEmail(email) } returns null

            val result = handler.handle(LoginUserCommand("test@example.com", "password123"))

            result.isLeft() shouldBe true
            result.leftOrNull() shouldBe LoginUserHandler.Error.UserNotFound
        }

        test("invalid password returns InvalidPassword error") {
            coEvery { userRepository.findByEmail(email) } returns user
            every { passwordHasher.verify(any(), any()) } returns false
            coEvery { userRepository.save(any()) } returns Unit

            val result = handler.handle(LoginUserCommand("test@example.com", "wrongpassword"))

            result.isLeft() shouldBe true
            result.leftOrNull() shouldBe LoginUserHandler.Error.InvalidPassword
        }

        test("locked account returns AccountLocked error") {
            val lockedUser = user.copy(
                loginAttemptGuard = LoginAttemptGuard(
                    failedAttempts = 5,
                    lockedUntil = System.currentTimeMillis() + 100_000,
                ),
            )
            coEvery { userRepository.findByEmail(email) } returns lockedUser

            val result = handler.handle(LoginUserCommand("test@example.com", "password123"))

            result.isLeft() shouldBe true
            result.leftOrNull() shouldBe LoginUserHandler.Error.AccountLocked
        }

        test("failed login increments failed attempts") {
            coEvery { userRepository.findByEmail(email) } returns user
            every { passwordHasher.verify(any(), any()) } returns false
            coEvery { userRepository.save(any()) } returns Unit

            handler.handle(LoginUserCommand("test@example.com", "wrongpassword"))

            coVerify { userRepository.save(match { it.loginAttemptGuard.failedAttempts == 1 }) }
        }
    }
})
