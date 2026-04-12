package auth.command

import arrow.core.Either
import arrow.core.flatMap
import arrow.core.left
import arrow.core.right
import auth.model.user.Email
import auth.model.user.PlainPassword
import auth.port.PasswordHasher
import auth.port.TokenIssuer
import auth.port.UserRepository

class LoginUserHandler(
    private val userRepository: UserRepository,
    private val passwordHasher: PasswordHasher,
    private val tokenIssuer: TokenIssuer,
) {
    sealed interface Error {
        data object UserNotFound : Error
        data object InvalidPassword : Error
        data object AccountLocked : Error
    }

    suspend fun handle(command: LoginUserCommand): Either<Error, String> {
        val email = Email.of(command.email).getOrNull() ?: return Error.UserNotFound.left()
        val user = userRepository.findByEmail(email) ?: return Error.UserNotFound.left()

        if (user.loginAttemptGuard.isLocked()) return Error.AccountLocked.left()

        val plainPassword = PlainPassword(command.password)
        val isValid = passwordHasher.verify(plainPassword, user.password)

        return if (isValid) {
            userRepository.save(user.copy(loginAttemptGuard = user.loginAttemptGuard.onSuccess()))
            tokenIssuer.issue(user.id).right()
        } else {
            userRepository.save(user.copy(loginAttemptGuard = user.loginAttemptGuard.onFailure()))
            Error.InvalidPassword.left()
        }
    }
}
