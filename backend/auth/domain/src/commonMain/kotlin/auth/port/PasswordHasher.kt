package auth.port

import auth.model.user.HashedPassword
import auth.model.user.PlainPassword

interface PasswordHasher {
    fun hash(password: PlainPassword): HashedPassword
    fun verify(password: PlainPassword, hash: HashedPassword): Boolean
}
