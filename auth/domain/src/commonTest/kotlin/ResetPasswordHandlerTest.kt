import auth.command.ResetPasswordCommand
import auth.command.ResetPasswordError
import auth.command.ResetPasswordHandler
import auth.model.passwordreset.PasswordResetToken
import auth.model.user.Email
import auth.model.user.HashedPassword
import auth.model.user.PlainPassword
import auth.model.user.User
import auth.model.user.UserId
import auth.port.PasswordHasher
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

class ResetPasswordHandlerTest :
    ShouldSpec({

        val users = mockk<UserRepository>()
        val tokens = mockk<PasswordResetTokenRepository>()
        val hasher = mockk<PasswordHasher>()
        val now = Instant.parse("2026-01-01T00:00:00Z")
        val clock = Clock.fixed(now, ZoneId.of("UTC"))

        val handler =
            ResetPasswordHandler(
                users = users,
                tokens = tokens,
                hasher = hasher,
                clock = clock,
            )

        val fixedId = UserId(UUID.fromString("00000000-0000-0000-0000-000000000001"))
        val tokenValue = "valid-reset-token"
        val newPassword = "NewPassword1"

        fun makeUser() =
            User(
                id = fixedId,
                email = Email.create("user@example.com"),
                hashedPassword = HashedPassword.create(PlainPassword("OldPassword1"), hasher),
                createdAt = Instant.parse("2025-01-01T00:00:00Z"),
            )

        fun makeToken(expiresAt: Instant = now.plusSeconds(900)) =
            PasswordResetToken(
                value = tokenValue,
                userId = fixedId,
                expiresAt = expiresAt,
            )

        beforeEach {
            clearMocks(users, tokens, hasher)
            every { hasher.hash(any()) } returns "hashed"
            every { hasher.verify(any(), any()) } returns false
            coEvery { users.save(any()) } just Runs
            coEvery { tokens.deleteByUserId(any()) } just Runs
        }

        should("reset password successfully with valid token") {
            coEvery { tokens.findByValue(tokenValue) } returns makeToken()
            coEvery { users.findById(fixedId) } returns makeUser()

            val result = handler.handle(ResetPasswordCommand(tokenValue, newPassword))

            result.shouldBeRight(Unit)
            coVerify(exactly = 1) { users.save(any()) }
            coVerify(exactly = 1) { tokens.deleteByUserId(fixedId) }
        }

        should("return TokenNotFound when token does not exist") {
            coEvery { tokens.findByValue(tokenValue) } returns null

            val result = handler.handle(ResetPasswordCommand(tokenValue, newPassword))

            result.shouldBeLeft(ResetPasswordError.TokenNotFound)
            coVerify(exactly = 0) { users.save(any()) }
        }

        should("return TokenExpired when token is expired") {
            coEvery { tokens.findByValue(tokenValue) } returns makeToken(expiresAt = now.minusSeconds(1))

            val result = handler.handle(ResetPasswordCommand(tokenValue, newPassword))

            result.shouldBeLeft(ResetPasswordError.TokenExpired)
            coVerify(exactly = 0) { users.save(any()) }
        }

        should("return UserNotFound when user is missing") {
            coEvery { tokens.findByValue(tokenValue) } returns makeToken()
            coEvery { users.findById(fixedId) } returns null

            val result = handler.handle(ResetPasswordCommand(tokenValue, newPassword))

            result.shouldBeLeft(ResetPasswordError.UserNotFound)
            coVerify(exactly = 0) { users.save(any()) }
        }

        should("delete token after successful password reset") {
            coEvery { tokens.findByValue(tokenValue) } returns makeToken()
            coEvery { users.findById(fixedId) } returns makeUser()

            handler.handle(ResetPasswordCommand(tokenValue, newPassword))

            coVerify(ordering = io.mockk.Ordering.ORDERED) {
                users.save(any())
                tokens.deleteByUserId(fixedId)
            }
        }
    })
