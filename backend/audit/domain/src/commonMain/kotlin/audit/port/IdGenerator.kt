package audit.port

import audit.model.ExampleId

interface IdGenerator {
    fun generate(): ExampleId
}
