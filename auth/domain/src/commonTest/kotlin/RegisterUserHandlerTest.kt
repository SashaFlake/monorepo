import auth.command.RegisterUserCommand
import auth.command.RegisterUserError
import auth.command.RegisterUserHandler
import auth.model.user.Email
import auth.model.user.UserId
import auth.port.PasswordHasher
import auth.port.UserRepository
import io.kotest.assertions.arrow.core.shouldBeLeft
import io.kotest.assertions.arrow.core.shouldBeRight
import io.kotest.core.spec.style.ShouldSpec
import io.mockk.Runs
import io.mockk.clearMocks
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.just
import io.mockk.mockk
import java.time.Clock
import java.time.Instant
import java.time.ZoneId
import java.util.UUID

class RegisterUserHandlerTest :
    ShouldSpec({

        val users = mockk<UserRepository>()
        val hasher = mockk<PasswordHasher>()
        val clock = Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneId.of("UTC"))
        val fixedId = UserId(UUID.fromString("00000000-0000-0000-0000-000000000001"))
        val idGenerator = mockk<IdGenerator>()

        val handler =
            RegisterUserHandler(
                users = users,
                hasher = hasher,
                clock = clock,
                idGenerator = idGenerator,
            )

        beforeEach {
            clearMocks(users, hasher, idGenerator)
            every { hasher.hash(any()) } returns "hashed"
            every { idGenerator.generate() } returns fixedId
            coEvery { users.save(any()) } just Runs
        }

        should("return UserId when registration succeeds") {
            coEvery { users.existsByEmail(any()) } returns false

            val result = handler.handle(RegisterUserCommand("user@example.com", "Password1"))

            result.shouldBeRight(fixedId)
            coVerify(exactly = 1) { users.save(any()) }
        }

        should("return UserAlreadyExists when email is taken") {
            coEvery { users.existsByEmail(any()) } returns true

            val result = handler.handle(RegisterUserCommand("user@example.com", "Password1"))

            result.shouldBeLeft(RegisterUserError.UserAlreadyExists)
            coVerify(exactly = 0) { users.save(any()) }
        }

        should("return InvalidEmail when email is malformed") {
            val result = handler.handle(RegisterUserCommand("not-an-email", "Password1"))

            result.shouldBeLeft(RegisterUserError.InvalidEmail)
            coVerify(exactly = 0) { users.existsByEmail(any()) }
            coVerify(exactly = 0) { users.save(any()) }
        }

        should("normalize email before checking existence") {
            coEvery { users.existsByEmail(Email.create("user@example.com")) } returns false

            val result = handler.handle(RegisterUserCommand("  User@Example.COM  ", "Password1"))

            result.shouldBeRight(fixedId)
        }

        should("save user with correct email") {
            coEvery { users.existsByEmail(any()) } returns false

            handler.handle(RegisterUserCommand("user@example.com", "Password1"))

            coVerify { users.save(match { it.email == Email.create("user@example.com") }) }
        }
    })
