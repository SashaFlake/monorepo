package auth.port

import auth.model.user.Email
import auth.model.user.User
import auth.model.user.UserId

interface UserRepository {
    suspend fun save(user: User)
    suspend fun findByEmail(email: Email): User?
    suspend fun findById(id: UserId): User?
}
