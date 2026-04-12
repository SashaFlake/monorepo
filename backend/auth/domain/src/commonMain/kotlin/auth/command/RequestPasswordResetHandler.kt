package auth.command

import arrow.core.Either
import arrow.core.left
import arrow.core.right
import auth.model.user.Email
import auth.port.EmailSender
import auth.port.PasswordResetTokenGenerator
import auth.port.PasswordResetTokenRepository
import auth.port.UserRepository

class RequestPasswordResetHandler(
    private val userRepository: UserRepository,
    private val passwordResetTokenRepository: PasswordResetTokenRepository,
    private val passwordResetTokenGenerator: PasswordResetTokenGenerator,
    private val emailSender: EmailSender,
) {
    sealed interface Error {
        data object UserNotFound : Error
    }

    suspend fun handle(command: RequestPasswordResetCommand): Either<Error, Unit> {
        val email = Email.of(command.email).getOrNull() ?: return Error.UserNotFound.left()
        val user = userRepository.findByEmail(email) ?: return Error.UserNotFound.left()

        val token = passwordResetTokenGenerator.generate(user.id)
        passwordResetTokenRepository.save(token)
        emailSender.send(user.email, "Password Reset", "Your token: ${token.token}")

        return Unit.right()
    }
}
