package com.sashaflake.infrastructure.persistence.dragonfly

import auth.model.passwordreset.PasswordResetToken
import auth.model.user.UserId
import auth.port.PasswordResetTokenRepository
import io.lettuce.core.ExperimentalLettuceCoroutinesApi
import io.lettuce.core.api.StatefulRedisConnection
import io.lettuce.core.api.coroutines
import java.time.Instant

@OptIn(ExperimentalLettuceCoroutinesApi::class)
class DragonflyPasswordResetTokenRepository(
    private val connection: StatefulRedisConnection<String, String>,
    private val clock: java.time.Clock,
) : PasswordResetTokenRepository {
    private fun tokenKey(value: String) = "prt:token:$value"
    private fun userKey(userId: UserId) = "prt:user:${userId.value}"

    override suspend fun save(token: PasswordResetToken) {
        val cmd = connection.coroutines()
        val ttl = token.expiresAt.epochSecond - clock.instant().epochSecond
        if (ttl <= 0) return
        val serialized = "${token.value}|${token.userId.value}|${token.expiresAt.epochSecond}"
        cmd.setex(tokenKey(token.value), ttl, serialized)
        cmd.setex(userKey(token.userId), ttl, token.value)
    }

    override suspend fun findByValue(value: String): PasswordResetToken? {
        val raw = connection.coroutines().get(tokenKey(value)) ?: return null
        return deserialize(raw)
    }

    override suspend fun deleteByUserId(userId: UserId) {
        val cmd = connection.coroutines()
        val tokenValue = cmd.get(userKey(userId)) ?: return
        cmd.del(tokenKey(tokenValue), userKey(userId))
    }

    private fun deserialize(raw: String): PasswordResetToken? =
        runCatching {
            val parts = raw.split("|")
            PasswordResetToken(
                value = parts[0],
                userId = UserId.fromString(parts[1]),
                expiresAt = Instant.ofEpochSecond(parts[2].toLong()),
            )
        }.getOrNull()
}
