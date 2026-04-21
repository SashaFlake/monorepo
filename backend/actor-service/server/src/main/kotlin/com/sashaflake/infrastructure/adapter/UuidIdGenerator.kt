package com.sashaflake.infrastructure.adapter

import __PACKAGE__.model.ExampleId
import __PACKAGE__.port.IdGenerator
import java.util.UUID

class UuidIdGenerator : IdGenerator {
    override fun generate(): ExampleId = ExampleId(UUID.randomUUID())
}
