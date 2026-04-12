package com.sashaflake.infrastructure.adapter

import auth.model.user.UserId
import auth.port.IdGenerator
import java.util.UUID

class UuidIdGenerator : IdGenerator {
    override fun generate(): UserId = UserId(UUID.randomUUID())
}
