package auth.model.user

import arrow.core.Either
import arrow.core.left
import arrow.core.right

@JvmInline
value class PlainPassword private constructor(val value: String) {
    companion object {
        private const val MIN_LENGTH = 8

        operator fun invoke(value: String) = PlainPassword(value)

        fun of(value: String): Either<InvalidPassword, PlainPassword> =
            if (value.length >= MIN_LENGTH) PlainPassword(value).right() else InvalidPassword.left()

        data object InvalidPassword
    }
}
