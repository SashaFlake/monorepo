package com.sashaflake.infrastructure.metrics

import io.micrometer.core.instrument.Counter
import io.micrometer.core.instrument.MeterRegistry
import io.micrometer.core.instrument.Timer

class AuthMetrics(registry: MeterRegistry) {
    val registerAttempts: Counter =
        Counter
            .builder("auth.register.attempts")
            .description("Total registration attempts")
            .register(registry)

    val registerSuccess: Counter =
        Counter
            .builder("auth.register.success")
            .description("Successful registrations")
            .register(registry)

    val registerFailures: Counter =
        Counter
            .builder("auth.register.failures")
            .description("Failed registrations")
            .register(registry)

    val loginAttempts: Counter =
        Counter
            .builder("auth.login.attempts")
            .description("Total login attempts")
            .register(registry)

    val loginSuccess: Counter =
        Counter
            .builder("auth.login.success")
            .description("Successful logins")
            .register(registry)

    val loginFailures: Counter =
        Counter
            .builder("auth.login.failures")
            .description("Failed logins")
            .register(registry)

    val loginTimer: Timer =
        Timer
            .builder("auth.login.duration")
            .description("Login request duration")
            .register(registry)

    val passwordResetRequests: Counter =
        Counter
            .builder("auth.password_reset.requests")
            .description("Password reset requests")
            .register(registry)

    val passwordResetSuccess: Counter =
        Counter
            .builder("auth.password_reset.success")
            .description("Successful password resets")
            .register(registry)

    val passwordResetFailures: Counter =
        Counter
            .builder("auth.password_reset.failures")
            .description("Failed password resets")
            .register(registry)
}
