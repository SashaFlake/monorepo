package auth.model.user

data class LoginAttemptGuard(
    val failedAttempts: Int,
    val lockedUntil: Long?,
) {
    fun isLocked(): Boolean = lockedUntil != null && System.currentTimeMillis() < lockedUntil

    fun onSuccess(): LoginAttemptGuard = copy(failedAttempts = 0, lockedUntil = null)

    fun onFailure(): LoginAttemptGuard {
        val attempts = failedAttempts + 1
        val locked = if (attempts >= MAX_ATTEMPTS) System.currentTimeMillis() + LOCK_DURATION_MS else null
        return copy(failedAttempts = attempts, lockedUntil = locked)
    }

    companion object {
        private const val MAX_ATTEMPTS = 5
        private const val LOCK_DURATION_MS = 15 * 60 * 1000L

        fun initial() = LoginAttemptGuard(failedAttempts = 0, lockedUntil = null)
    }
}
