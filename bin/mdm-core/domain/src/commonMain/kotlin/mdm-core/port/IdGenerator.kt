package __PACKAGE__.port

import __PACKAGE__.model.ExampleId

interface IdGenerator {
    fun generate(): ExampleId
}
