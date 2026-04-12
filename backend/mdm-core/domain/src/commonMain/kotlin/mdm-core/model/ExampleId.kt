package __PACKAGE__.model

import java.util.UUID

// Замени Example на имя своей entity
@JvmInline
value class ExampleId(
    val value: UUID,
) {
    companion object {
        fun generate(): ExampleId = ExampleId(UUID.randomUUID())
    }

    override fun toString(): String = value.toString()
}
