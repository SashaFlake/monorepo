package com.sashaflake.infrastructure.persistence.dragonfly

import auth.model.user.Email
import auth.model.user.HashedPassword
import auth.model.user.LoginAttemptGuard
import auth.model.user.User
import auth.model.user.UserId
import auth.port.UserRepository
import io.lettuce.core.api.async.RedisAsyncCommands
import java.util.UUID
import kotlinx.coroutines.future.await

class DragonflyUserRepository(
    private val redis: RedisAsyncCommands<String, String>,
) : UserRepository {
    companion object {
        private const val PREFIX = "user:"
        private const val ID_INDEX_PREFIX = "user_id:"
        private const val FIELD_ID = "id"
        private const val FIELD_EMAIL = "email"
        private const val FIELD_PASSWORD = "password"
        private const val FIELD_FAILED_ATTEMPTS = "failedAttempts"
        private const val FIELD_LOCKED_UNTIL = "lockedUntil"
    }

    override suspend fun save(user: User) {
        val key = "$PREFIX${user.email.value}"
        redis.hset(
            key,
            mapOf(
                FIELD_ID to user.id.value.toString(),
                FIELD_EMAIL to user.email.value,
                FIELD_PASSWORD to user.password.value,
                FIELD_FAILED_ATTEMPTS to user.loginAttemptGuard.failedAttempts.toString(),
                FIELD_LOCKED_UNTIL to (user.loginAttemptGuard.lockedUntil?.toString() ?: ""),
            ),
        ).await()
        redis.set("$ID_INDEX_PREFIX${user.id.value}", user.email.value).await()
    }

    override suspend fun findByEmail(email: Email): User? {
        val key = "$PREFIX${email.value}"
        val data = redis.hgetall(key).await()
        if (data.isNullOrEmpty()) return null
        return toUser(data)
    }

    override suspend fun findById(id: UserId): User? {
        val email = redis.get("$ID_INDEX_PREFIX${id.value}").await() ?: return null
        return findByEmail(Email.of(email).getOrNull() ?: return null)
    }

    private fun toUser(data: Map<String, String>): User {
        val lockedUntilStr = data[FIELD_LOCKED_UNTIL]
        val lockedUntil = if (lockedUntilStr.isNullOrBlank()) null else lockedUntilStr.toLongOrNull()
        return User(
            id = UserId(UUID.fromString(data[FIELD_ID]!!)),
            email = Email.of(data[FIELD_EMAIL]!!).getOrNull()!!,
            password = HashedPassword.fromTrustedSource(data[FIELD_PASSWORD]!!),
            loginAttemptGuard = LoginAttemptGuard(
                failedAttempts = data[FIELD_FAILED_ATTEMPTS]!!.toInt(),
                lockedUntil = lockedUntil,
            ),
        )
    }
}
