class Email private constructor(val value: String) {
    companion object {
        private val EMAIL_REGEX = Regex("^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$")

        fun create(raw: String): Email {
            val trimmed = raw.trim()
            require(EMAIL_REGEX.matches(trimmed)) {
                "Invalid email format: $trimmed"
            }
            return Email(trimmed.lowercase())
        }
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Email) return false
        return value == other.value
    }

    override fun hashCode(): Int = value.hashCode()

    override fun toString(): String = value
}
