package com.sashaflake.infrastructure.adapter

import at.favre.lib.crypto.bcrypt.BCrypt
import auth.model.user.HashedPassword
import auth.model.user.PlainPassword
import auth.port.PasswordHasher

class BCryptPasswordHasher : PasswordHasher {
    override fun hash(password: PlainPassword): HashedPassword {
        val hashed = BCrypt.withDefaults().hashToString(12, password.value.toCharArray())
        return HashedPassword.fromTrustedSource(hashed)
    }

    override fun verify(password: PlainPassword, hash: HashedPassword): Boolean =
        BCrypt.verifyer().verify(password.value.toCharArray(), hash.value).verified
}
