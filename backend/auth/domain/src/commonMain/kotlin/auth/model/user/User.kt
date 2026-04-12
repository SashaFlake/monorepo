package auth.model.user

data class User(
    val id: UserId,
    val email: Email,
    val password: HashedPassword,
    val loginAttemptGuard: LoginAttemptGuard,
)
