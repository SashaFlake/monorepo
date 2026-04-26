import auth.command.RequestPasswordResetCommand
import auth.command.RequestPasswordResetError
import auth.command.RequestPasswordResetHandler
import auth.model.user.Email
import auth.model.user.PlainPassword
import auth.model.user.User
import auth.model.user.UserId
import auth.port.PasswordResetTokenRepository
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

class RequestPasswordResetHandlerTest :
    ShouldSpec({

        val users = mockk<UserRepository>()
        val tokens = mockk<PasswordResetTokenRepository>()
        val emailSender = mockk<EmailSender>()
        val tokenGenerator = mockk<auth.port.PasswordResetTokenGenerator>()
        val clock = Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneId.of("UTC"))
        val hasher = mockk<auth.port.PasswordHasher>()

        val handler =
            RequestPasswordResetHandler(
                users = users,
                tokens = tokens,
                emailSender = emailSender,
                tokenGenerator = tokenGenerator,
                clock = clock,
            )

        val fixedId = UserId(UUID.fromString("00000000-0000-0000-0000-000000000001"))
        val email = "user@example.com"
        val tokenValue = "reset-token-123"

        fun makeUser() =
            User(
                id = fixedId,
                email = Email.create(email),
                hashedPassword = auth.model.user.HashedPassword.create(PlainPassword("Password1"), hasher),
                createdAt = Instant.parse("2025-01-01T00:00:00Z"),
            )

        beforeEach {
            clearMocks(users, tokens, emailSender, tokenGenerator, hasher)
            every { hasher.hash(any()) } returns "hashed"
            every { tokenGenerator.generate() } returns tokenValue
            coEvery { tokens.deleteByUserId(any()) } just Runs
            coEvery { tokens.save(any()) } just Runs
            coEvery { emailSender.sendPasswordResetEmail(any(), any()) } just Runs
        }

        should("send reset email when user exists") {
            coEvery { users.findByEmail(Email.create(email)) } returns makeUser()

            val result = handler.handle(RequestPasswordResetCommand(email))

            result.shouldBeRight(Unit)
            coVerify(exactly = 1) { emailSender.sendPasswordResetEmail(Email.create(email), tokenValue) }
            coVerify(exactly = 1) { tokens.save(any()) }
        }

        should("succeed silently when user does not exist") {
            coEvery { users.findByEmail(any()) } returns null

            val result = handler.handle(RequestPasswordResetCommand(email))

            result.shouldBeRight(Unit)
            coVerify(exactly = 0) { emailSender.sendPasswordResetEmail(any(), any()) }
            coVerify(exactly = 0) { tokens.save(any()) }
        }

        should("return InvalidEmail when email is malformed") {
            val result = handler.handle(RequestPasswordResetCommand("not-an-email"))

            result.shouldBeLeft(RequestPasswordResetError.InvalidEmail)
            coVerify(exactly = 0) { users.findByEmail(any()) }
        }

        should("delete existing token before saving new one") {
            coEvery { users.findByEmail(Email.create(email)) } returns makeUser()

            handler.handle(RequestPasswordResetCommand(email))

            coVerify(ordering = io.mockk.Ordering.ORDERED) {
                tokens.deleteByUserId(fixedId)
                tokens.save(any())
            }
        }
    })
