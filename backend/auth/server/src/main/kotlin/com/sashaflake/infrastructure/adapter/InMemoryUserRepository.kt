package com.sashaflake.infrastructure.adapter

import auth.model.user.Email
import auth.model.user.User
import auth.model.user.UserId
import auth.port.UserRepository
import java.util.concurrent.ConcurrentHashMap

class InMemoryUserRepository : UserRepository {
    private val users = ConcurrentHashMap<String, User>()

    override suspend fun save(user: User) {
        users[user.email.value] = user
    }

    override suspend fun findByEmail(email: Email): User? = users[email.value]

    override suspend fun findById(id: UserId): User? = users.values.find { it.id == id }
}
