package auth.command

import arrow.core.Either
import arrow.core.left
import arrow.core.right
import auth.model.user.Email
import auth.model.user.LoginAttemptGuard
import auth.model.user.PlainPassword
import auth.model.user.User
import auth.port.IdGenerator
import auth.port.PasswordHasher
import auth.port.UserRepository

class RegisterUserHandler(
    private val userRepository: UserRepository,
    private val passwordHasher: PasswordHasher,
    private val idGenerator: IdGenerator,
) {
    sealed interface Error {
        data object UserAlreadyExists : Error
        data object InvalidEmail : Error
        data object InvalidPassword : Error
    }

    suspend fun handle(command: RegisterUserCommand): Either<Error, Unit> {
        val email = Email.of(command.email).getOrElse { return Error.InvalidEmail.left() }
        val plainPassword =
            PlainPassword.of(command.password).getOrElse { return Error.InvalidPassword.left() }

        if (userRepository.findByEmail(email) != null) return Error.UserAlreadyExists.left()

        val hashedPassword = passwordHasher.hash(plainPassword)
        val user = User(
            id = idGenerator.generate(),
            email = email,
            password = hashedPassword,
            loginAttemptGuard = LoginAttemptGuard.initial(),
        )
        userRepository.save(user)
        return Unit.right()
    }
}
