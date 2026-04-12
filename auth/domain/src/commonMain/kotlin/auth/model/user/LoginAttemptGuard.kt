package auth.model.user

import java.time.Duration
import java.time.Instant

data class LoginAttemptGuard(
    val failedAttempts: Int = 0,
    val lockedUntil: Instant? = null,
) {
    companion object {
        private const val MAX_FAILED_ATTEMPTS = 5
        private val LOCKOUT_DURATION: Duration = Duration.ofMinutes(15)
    }

    fun isLocked(now: Instant): Boolean =
        lockedUntil != null && now.isBefore(lockedUntil)

    fun recordFailure(now: Instant): LoginAttemptGuard {
        val newCount = failedAttempts + 1
        return if (newCount >= MAX_FAILED_ATTEMPTS) {
            copy(failedAttempts = newCount, lockedUntil = now.plus(LOCKOUT_DURATION))
        } else {
            copy(failedAttempts = newCount)
        }
    }

    fun reset(): LoginAttemptGuard = copy(failedAttempts = 0, lockedUntil = null)
}
