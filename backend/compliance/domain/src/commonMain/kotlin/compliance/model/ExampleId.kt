package compliance.model

import java.util.UUID

@JvmInline
value class ExampleId(
    val value: UUID,
) {
    override fun toString(): String = value.toString()
}
