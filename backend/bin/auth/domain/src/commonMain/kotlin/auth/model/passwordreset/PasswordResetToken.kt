package auth.model.passwordreset

import auth.model.user.UserId
import java.time.Instant

data class PasswordResetToken(
    val value: String,
    val userId: UserId,
    val expiresAt: Instant,
) {
    fun isExpired(now: Instant): Boolean = now.isAfter(expiresAt)

    companion object {
        private val TTL = java.time.Duration.ofHours(1)

        fun create(
            value: String,
            userId: UserId,
            now: Instant,
        ): PasswordResetToken =
            PasswordResetToken(
                value = value,
                userId = userId,
                expiresAt = now.plus(TTL),
            )
    }
}
