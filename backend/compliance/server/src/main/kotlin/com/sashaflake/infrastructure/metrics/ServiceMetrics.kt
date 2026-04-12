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
        createAttempts = Counter.builder("compliance_create_attempts_total").register(registry)
        createSuccess = Counter.builder("compliance_create_success_total").register(registry)
        createFailure = Counter.builder("compliance_create_failure_total").register(registry)
        createTimer = Timer.builder("compliance_create_duration_seconds").register(registry)
    }

    fun recordCreateAttempt() = createAttempts.increment()
    fun recordCreateSuccess() = createSuccess.increment()
    fun recordCreateFailure() = createFailure.increment()
    fun getCreateTimer() = createTimer
}
