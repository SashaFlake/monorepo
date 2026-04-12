package com.sashaflake.infrastructure.adapter

import compliance.model.ExampleId
import compliance.port.IdGenerator
import java.util.UUID

class UuidIdGenerator : IdGenerator {
    override fun generate(): ExampleId = ExampleId(UUID.randomUUID())
}
