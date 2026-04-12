package compliance.port

import compliance.model.ExampleId

interface IdGenerator {
    fun generate(): ExampleId
}
