package auth.port

import auth.model.passwordreset.PasswordResetToken
import auth.model.user.UserId

interface PasswordResetTokenGenerator {
    fun generate(userId: UserId): PasswordResetToken
}
