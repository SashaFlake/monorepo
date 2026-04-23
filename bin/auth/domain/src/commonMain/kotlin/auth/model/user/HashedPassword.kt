package auth.model.user

import auth.port.PasswordHasher

@JvmInline
value class HashedPassword(val value: String) {
    fun matches(plain: PlainPassword, hasher: PasswordHasher): Boolean =
        hasher.verify(plain.value, value)

    companion object {
        fun of(
            plain: PlainPassword,
            hasher: PasswordHasher,
        ): HashedPassword {
            val hash = hasher.hash(plain.value)
            return HashedPassword(hash)
        }
    }
}
