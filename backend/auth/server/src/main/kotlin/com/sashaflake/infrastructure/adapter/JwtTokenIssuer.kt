package com.sashaflake.infrastructure.adapter

import auth.model.user.UserId
import auth.port.TokenIssuer
import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import java.util.Date

class JwtTokenIssuer(private val secret: String, private val issuer: String) : TokenIssuer {
    override fun issue(userId: UserId): String =
        JWT.create()
            .withIssuer(issuer)
            .withSubject(userId.toString())
            .withExpiresAt(Date(System.currentTimeMillis() + 86_400_000))
            .sign(Algorithm.HMAC256(secret))
}
