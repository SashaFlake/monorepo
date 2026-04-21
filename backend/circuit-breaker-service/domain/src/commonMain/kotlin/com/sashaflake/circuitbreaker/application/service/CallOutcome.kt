package com.sashaflake.circuitbreaker.application.service

import com.sashaflake.circuitbreaker.model.CircuitBreaker

/**
 * Either-style sealed результат вызова через Circuit Breaker.
 * Позволяет обрабатывать все три исхода без исключений.
 */
sealed interface CallOutcome<out T> {
    /** Вызов выполнен успешно. */
    data class Success<T>(val value: T, val cb: CircuitBreaker) : CallOutcome<T>

    /** CB в состоянии OPEN — вызов отклонён без исполнения. */
    data class Rejected(val cb: CircuitBreaker) : CallOutcome<Nothing>

    /** Вызов был выполнен, но завершился ошибкой. */
    data class Failed(val cause: Throwable, val cb: CircuitBreaker) : CallOutcome<Nothing>
}
