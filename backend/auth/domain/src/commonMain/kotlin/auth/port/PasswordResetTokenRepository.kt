package auth.port

import auth.model.passwordreset.PasswordResetToken

interface PasswordResetTokenRepository {
    suspend fun save(token: PasswordResetToken)
    suspend fun findByToken(token: String): PasswordResetToken?
    suspend fun delete(token: String)
}
