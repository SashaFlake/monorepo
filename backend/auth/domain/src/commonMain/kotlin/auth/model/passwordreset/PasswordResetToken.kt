package auth.model.passwordreset

import auth.model.user.UserId
import kotlin.time.Duration.Companion.hours
import kotlin.time.TimeSource

data class PasswordResetToken(
    val token: String,
    val userId: UserId,
    val expiresAt: Long,
) {
    fun isExpired(): Boolean = TimeSource.Monotonic.markNow().elapsedNow().inWholeMilliseconds > expiresAt

    companion object {
        val EXPIRATION = 1.hours
    }
}
