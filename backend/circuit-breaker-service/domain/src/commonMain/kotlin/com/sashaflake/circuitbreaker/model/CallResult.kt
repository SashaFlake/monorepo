package com.sashaflake.circuitbreaker.model

/** Результат одного вызова через Circuit Breaker. */
sealed interface CallResult {
    /** Вызов выполнен успешно. */
    data object Success : CallResult

    /** Вызов завершился ошибкой (внешний сервис вернул ошибку). */
    data class Failure(val cause: Throwable) : CallResult

    /** Вызов отклонён самим Circuit Breaker — он в состоянии OPEN. */
    data object Rejected : CallResult
}
