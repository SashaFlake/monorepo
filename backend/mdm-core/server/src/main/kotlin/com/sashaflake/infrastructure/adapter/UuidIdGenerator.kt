package com.sashaflake.infrastructure.adapter

import mdmcore.model.ExampleId
import mdmcore.port.IdGenerator
import java.util.UUID

class UuidIdGenerator : IdGenerator {
    override fun generate(): ExampleId = ExampleId(UUID.randomUUID())
}
