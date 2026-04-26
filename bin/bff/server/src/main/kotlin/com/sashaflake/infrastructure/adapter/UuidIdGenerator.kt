package com.sashaflake.infrastructure.adapter

import bff.model.ExampleId
import bff.port.IdGenerator
import java.util.UUID

class UuidIdGenerator : IdGenerator {
    override fun generate(): ExampleId = ExampleId(UUID.randomUUID())
}
