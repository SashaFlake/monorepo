package com.sashaflake.infrastructure.persistence.dragonfly

import auth.model.user.Email
import auth.model.user.HashedPassword
import auth.model.user.LoginAttemptGuard
import auth.model.user.PlainPassword
import auth.model.user.User
import auth.model.user.UserId
import auth.port.UserRepository
import io.lettuce.core.ExperimentalLettuceCoroutinesApi
import io.lettuce.core.api.StatefulRedisConnection
import io.lettuce.core.api.coroutines
import java.time.Instant

@OptIn(ExperimentalLettuceCoroutinesApi::class)
class DragonflyUserRepository(
    private val connection: StatefulRedisConnection<String, String>,
    private val hasher: auth.port.PasswordHasher,
) : UserRepository {
    private fun userKey(id: UserId) = "user:id:${id.value}"
    private fun emailKey(email: Email) = "user:email:${email.value}"

    override suspend fun findById(id: UserId): User? {
        val hash = connection.coroutines().hgetall(userKey(id))
        return if (hash.isEmpty()) null else deserialize(hash)
    }

    override suspend fun findByEmail(email: Email): User? {
        val id = connection.coroutines().get(emailKey(email)) ?: return null
        return findById(UserId.fromString(id))
    }

    override suspend fun save(user: User) {
        val cmd = connection.coroutines()
        val map = mapOf(
            "id" to user.id.value.toString(),
            "email" to user.email.value,
            "hashedPassword" to user.getHashedPassword().value,
            "failedAttempts" to user.getLoginAttemptGuard().failedAttempts.toString(),
            "lockedUntil" to (user.getLoginAttemptGuard().lockedUntil?.epochSecond?.toString() ?: ""),
            "createdAt" to user.createdAt.epochSecond.toString(),
        )
        cmd.hset(userKey(user.id), map)
        cmd.set(emailKey(user.email), user.id.value.toString())
    }

    override suspend fun existsByEmail(email: Email): Boolean =
        connection.coroutines().exists(emailKey(email)) == 1L

    private fun deserialize(map: Map<String, String>): User =
        User(
            id = UserId.fromString(map["id"]!!),
            email = Email.fromStorage(map["email"]!!),
            hashedPassword = HashedPassword(map["hashedPassword"]!!),
            loginAttemptGuard = LoginAttemptGuard(
                failedAttempts = map["failedAttempts"]!!.toInt(),
                lockedUntil = map["lockedUntil"]?.takeIf { it.isNotEmpty() }?.let { Instant.ofEpochSecond(it.toLong()) },
            ),
            createdAt = Instant.ofEpochSecond(map["createdAt"]!!.toLong()),
        )
}
