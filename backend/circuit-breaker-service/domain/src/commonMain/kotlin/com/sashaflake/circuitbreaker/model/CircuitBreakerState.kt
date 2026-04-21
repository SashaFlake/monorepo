package com.sashaflake.circuitbreaker.model

enum class CircuitBreakerState {
    /** Нормальная работа — вызовы проходят. */
    CLOSED,

    /** Слишком много ошибок — вызовы отклоняются без выполнения. */
    OPEN,

    /** Пробный режим — один вызов пропускается для проверки. */
    HALF_OPEN,
}
