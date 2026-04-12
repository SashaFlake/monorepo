package com.sashaflake.infrastructure.metrics

import io.micrometer.core.instrument.Counter
import io.micrometer.core.instrument.MeterRegistry
import io.micrometer.core.instrument.Timer

class ServiceMetrics {
    private lateinit var createAttempts: Counter
    private lateinit var createSuccess: Counter
    private lateinit var createFailure: Counter
    private lateinit var createTimer: Timer

    fun init(registry: MeterRegistry) {
        createAttempts = Counter.builder("audit_create_attempts_total")
            .description("Total create attempts")
            .register(registry)
        createSuccess = Counter.builder("audit_create_success_total")
            .description("Successful creates")
            .register(registry)
        createFailure = Counter.builder("audit_create_failure_total")
            .description("Failed creates")
            .register(registry)
        createTimer = Timer.builder("audit_create_duration_seconds")
            .description("Create request duration")
            .register(registry)
        // TODO: добавить метрики для остальных операций
    }

    fun recordCreateAttempt() = createAttempts.increment()
    fun recordCreateSuccess() = createSuccess.increment()
    fun recordCreateFailure() = createFailure.increment()
    fun getCreateTimer() = createTimer
}
