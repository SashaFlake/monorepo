package com.sashaflake.infrastructure.plugins

import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.plugins.calllogging.CallLogging
import io.micrometer.prometheus.PrometheusConfig
import io.micrometer.prometheus.PrometheusMeterRegistry

val Application.appMicrometerRegistry get() = attributes[micrometerKey]
private val micrometerKey = io.ktor.util.AttributeKey<PrometheusMeterRegistry>("micrometerKey")

fun Application.configureMonitoring() {
    val registry = PrometheusMeterRegistry(PrometheusConfig.DEFAULT)
    attributes.put(micrometerKey, registry)
    install(io.ktor.server.metrics.micrometer.MicrometerMetrics) {
        this.registry = registry
    }
    install(CallLogging)
}
