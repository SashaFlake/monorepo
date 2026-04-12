package auth.command

import arrow.core.Either
import arrow.core.left
import arrow.core.right
import auth.model.user.PlainPassword
import auth.port.PasswordHasher
import auth.port.PasswordResetTokenRepository
import auth.port.UserRepository

class ResetPasswordHandler(
    private val userRepository: UserRepository,
    private val passwordResetTokenRepository: PasswordResetTokenRepository,
    private val passwordHasher: PasswordHasher,
) {
    sealed interface Error {
        data object TokenNotFound : Error
        data object TokenExpired : Error
        data object UserNotFound : Error
        data object InvalidPassword : Error
    }

    suspend fun handle(command: ResetPasswordCommand): Either<Error, Unit> {
        val token =
            passwordResetTokenRepository.findByToken(command.token) ?: return Error.TokenNotFound.left()

        if (token.isExpired()) return Error.TokenExpired.left()

        val user = userRepository.findById(token.userId) ?: return Error.UserNotFound.left()
        val plainPassword =
            PlainPassword.of(command.newPassword).getOrElse { return Error.InvalidPassword.left() }
        val hashedPassword = passwordHasher.hash(plainPassword)

        userRepository.save(user.copy(password = hashedPassword))
        passwordResetTokenRepository.delete(token.token)

        return Unit.right()
    }
}
