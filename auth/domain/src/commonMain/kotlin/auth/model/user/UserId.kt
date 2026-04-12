package auth.model.user

import java.util.UUID

@JvmInline
value class UserId(val value: UUID) {
    override fun toString(): String = value.toString()

    companion object {
        fun fromString(s: String): UserId = UserId(UUID.fromString(s))
    }
}
