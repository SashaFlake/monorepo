package mdmcore.port

import mdmcore.model.ExampleId

interface IdGenerator {
    fun generate(): ExampleId
}
