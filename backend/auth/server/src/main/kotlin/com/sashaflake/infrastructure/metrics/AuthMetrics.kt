package com.sashaflake.infrastructure.metrics

import io.micrometer.core.instrument.Counter
import io.micrometer.core.instrument.MeterRegistry
import io.micrometer.core.instrument.Timer

class AuthMetrics {
    private lateinit var registerAttempts: Counter
    private lateinit var registerSuccess: Counter
    private lateinit var registerFailure: Counter
    private lateinit var loginAttempts: Counter
    private lateinit var loginSuccess: Counter
    private lateinit var loginFailure: Counter
    private lateinit var passwordResetRequests: Counter
    private lateinit var passwordResetSuccess: Counter
    private lateinit var passwordResetFailure: Counter
    private lateinit var registerTimer: Timer
    private lateinit var loginTimer: Timer
    private lateinit var passwordResetTimer: Timer

    fun init(registry: MeterRegistry) {
        registerAttempts = Counter.builder("auth_register_attempts_total")
            .description("Total registration attempts")
            .register(registry)
        registerSuccess = Counter.builder("auth_register_success_total")
            .description("Successful registrations")
            .register(registry)
        registerFailure = Counter.builder("auth_register_failure_total")
            .description("Failed registrations")
            .register(registry)
        loginAttempts = Counter.builder("auth_login_attempts_total")
            .description("Total login attempts")
            .register(registry)
        loginSuccess = Counter.builder("auth_login_success_total")
            .description("Successful logins")
            .register(registry)
        loginFailure = Counter.builder("auth_login_failure_total")
            .description("Failed logins")
            .register(registry)
        passwordResetRequests = Counter.builder("auth_password_reset_requests_total")
            .description("Total password reset requests")
            .register(registry)
        passwordResetSuccess = Counter.builder("auth_password_reset_success_total")
            .description("Successful password resets")
            .register(registry)
        passwordResetFailure = Counter.builder("auth_password_reset_failure_total")
            .description("Failed password resets")
            .register(registry)
        registerTimer = Timer.builder("auth_register_duration_seconds")
            .description("Registration request duration")
            .register(registry)
        loginTimer = Timer.builder("auth_login_duration_seconds")
            .description("Login request duration")
            .register(registry)
        passwordResetTimer = Timer.builder("auth_password_reset_duration_seconds")
            .description("Password reset request duration")
            .register(registry)
    }

    fun recordRegisterAttempt() = registerAttempts.increment()
    fun recordRegisterSuccess() = registerSuccess.increment()
    fun recordRegisterFailure() = registerFailure.increment()
    fun recordLoginAttempt() = loginAttempts.increment()
    fun recordLoginSuccess() = loginSuccess.increment()
    fun recordLoginFailure() = loginFailure.increment()
    fun recordPasswordResetRequest() = passwordResetRequests.increment()
    fun recordPasswordResetSuccess() = passwordResetSuccess.increment()
    fun recordPasswordResetFailure() = passwordResetFailure.increment()
    fun getRegisterTimer() = registerTimer
    fun getLoginTimer() = loginTimer
    fun getPasswordResetTimer() = passwordResetTimer
}
