package com.sashaflake.infrastructure.adapter

import auth.model.passwordreset.PasswordResetToken
import auth.model.user.UserId
import auth.port.PasswordResetTokenGenerator
import java.util.UUID

class UuidPasswordResetTokenGenerator : PasswordResetTokenGenerator {
    override fun generate(userId: UserId): PasswordResetToken =
        PasswordResetToken(
            token = UUID.randomUUID().toString(),
            userId = userId,
            expiresAt = System.currentTimeMillis() + PasswordResetToken.EXPIRATION.inWholeMilliseconds,
        )
}
