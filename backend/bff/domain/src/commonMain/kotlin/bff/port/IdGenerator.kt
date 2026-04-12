package bff.port

import bff.model.ExampleId

interface IdGenerator {
    fun generate(): ExampleId
}
