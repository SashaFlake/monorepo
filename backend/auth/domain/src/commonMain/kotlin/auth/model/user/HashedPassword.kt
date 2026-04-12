package auth.model.user

import arrow.core.Either
import arrow.core.left
import arrow.core.right

@JvmInline
value class HashedPassword private constructor(val value: String) {
    companion object {
        private const val MIN_LENGTH = 60

        fun of(value: String): Either<InvalidHashedPassword, HashedPassword> =
            if (value.length >= MIN_LENGTH) HashedPassword(value).right() else InvalidHashedPassword.left()

        fun fromTrustedSource(value: String): HashedPassword = HashedPassword(value)

        data object InvalidHashedPassword
    }
}
