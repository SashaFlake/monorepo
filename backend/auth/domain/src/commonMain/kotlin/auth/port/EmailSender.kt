package auth.port

import auth.model.user.Email

interface EmailSender {
    suspend fun send(to: Email, subject: String, body: String)
}
