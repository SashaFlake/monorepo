package com.sashaflake.infrastructure.adapter

import audit.model.ExampleId
import audit.port.IdGenerator
import java.util.UUID

class UuidIdGenerator : IdGenerator {
    override fun generate(): ExampleId = ExampleId(UUID.randomUUID())
}
