package com.sashaflake.infrastructure.adapter

import auth.model.passwordreset.PasswordResetToken
import auth.port.PasswordResetTokenRepository
import java.util.concurrent.ConcurrentHashMap

class InMemoryPasswordResetTokenRepository : PasswordResetTokenRepository {
    private val tokens = ConcurrentHashMap<String, PasswordResetToken>()

    override suspend fun save(token: PasswordResetToken) {
        tokens[token.token] = token
    }

    override suspend fun findByToken(token: String): PasswordResetToken? = tokens[token]

    override suspend fun delete(token: String) {
        tokens.remove(token)
    }
}
