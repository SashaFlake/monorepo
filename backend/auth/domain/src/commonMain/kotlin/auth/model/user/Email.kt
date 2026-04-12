package auth.model.user

import arrow.core.Either
import arrow.core.left
import arrow.core.right

@JvmInline
value class Email private constructor(val value: String) {
    companion object {
        private val EMAIL_REGEX = Regex("^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$")

        fun of(value: String): Either<InvalidEmail, Email> =
            if (EMAIL_REGEX.matches(value)) Email(value).right() else InvalidEmail.left()

        data object InvalidEmail
    }
}
