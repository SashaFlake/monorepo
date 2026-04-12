package com.sashaflake.infrastructure.persistence.dragonfly

import auth.model.passwordreset.PasswordResetToken
import auth.model.user.UserId
import auth.port.PasswordResetTokenRepository
import io.lettuce.core.api.async.RedisAsyncCommands
import java.util.UUID
import kotlinx.coroutines.future.await

class DragonflyPasswordResetTokenRepository(
    private val redis: RedisAsyncCommands<String, String>,
) : PasswordResetTokenRepository {
    companion object {
        private const val PREFIX = "pwd_reset:"
        private const val FIELD_USER_ID = "userId"
        private const val FIELD_EXPIRES_AT = "expiresAt"
    }

    override suspend fun save(token: PasswordResetToken) {
        val key = "$PREFIX${token.token}"
        redis.hset(
            key,
            mapOf(
                FIELD_USER_ID to token.userId.value.toString(),
                FIELD_EXPIRES_AT to token.expiresAt.toString(),
            ),
        ).await()
        val ttlSeconds = (token.expiresAt - System.currentTimeMillis()) / 1000 + 60
        redis.expire(key, ttlSeconds).await()
    }

    override suspend fun findByToken(token: String): PasswordResetToken? {
        val key = "$PREFIX$token"
        val data = redis.hgetall(key).await()
        if (data.isNullOrEmpty()) return null
        return PasswordResetToken(
            token = token,
            userId = UserId(UUID.fromString(data[FIELD_USER_ID]!!)),
            expiresAt = data[FIELD_EXPIRES_AT]!!.toLong(),
        )
    }

    override suspend fun delete(token: String) {
        redis.del("$PREFIX$token").await()
    }
}
