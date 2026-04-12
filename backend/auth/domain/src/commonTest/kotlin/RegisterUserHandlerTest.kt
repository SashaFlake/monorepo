import auth.command.RegisterUserCommand
import auth.command.RegisterUserHandler
import auth.model.user.Email
import auth.model.user.HashedPassword
import auth.model.user.LoginAttemptGuard
import auth.model.user.User
import auth.model.user.UserId
import auth.port.IdGenerator
import auth.port.PasswordHasher
import auth.port.UserRepository
import io.kotest.core.spec.style.FunSpec
import io.kotest.matchers.shouldBe
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import java.util.UUID

class RegisterUserHandlerTest : FunSpec({
    val userRepository = mockk<UserRepository>()
    val passwordHasher = mockk<PasswordHasher>()
    val idGenerator = mockk<IdGenerator>()
    val handler = RegisterUserHandler(userRepository, passwordHasher, idGenerator)

    context("handle") {
        test("successful registration returns Unit") {
            val userId = UserId(UUID.randomUUID())
            coEvery { userRepository.findByEmail(any()) } returns null
            every { idGenerator.generate() } returns userId
            every { passwordHasher.hash(any()) } returns HashedPassword.fromTrustedSource("hashedPassword1234567890123456789012345678901234567890")
            coEvery { userRepository.save(any()) } returns Unit

            val result = handler.handle(RegisterUserCommand("test@example.com", "password123"))

            result.isRight() shouldBe true
        }

        test("duplicate email returns UserAlreadyExists error") {
            val existingUser = User(
                id = UserId(UUID.randomUUID()),
                email = Email.of("test@example.com").getOrNull()!!,
                password = HashedPassword.fromTrustedSource("hashedPassword1234567890123456789012345678901234567890"),
                loginAttemptGuard = LoginAttemptGuard.initial(),
            )
            coEvery { userRepository.findByEmail(any()) } returns existingUser

            val result = handler.handle(RegisterUserCommand("test@example.com", "password123"))

            result.isLeft() shouldBe true
            result.leftOrNull() shouldBe RegisterUserHandler.Error.UserAlreadyExists
        }

        test("invalid email returns InvalidEmail error") {
            val result = handler.handle(RegisterUserCommand("invalidemail", "password123"))

            result.isLeft() shouldBe true
            result.leftOrNull() shouldBe RegisterUserHandler.Error.InvalidEmail
        }

        test("short password returns InvalidPassword error") {
            coEvery { userRepository.findByEmail(any()) } returns null
            val result = handler.handle(RegisterUserCommand("test@example.com", "short"))

            result.isLeft() shouldBe true
            result.leftOrNull() shouldBe RegisterUserHandler.Error.InvalidPassword
        }
    }
})
