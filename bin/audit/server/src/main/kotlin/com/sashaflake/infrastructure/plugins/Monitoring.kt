package com.sashaflake.infrastructure.plugins

import com.sashaflake.infrastructure.metrics.ServiceMetrics
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.metrics.micrometer.MicrometerMetrics
import io.ktor.server.plugins.calllogging.CallLogging
import io.micrometer.prometheus.PrometheusConfig
import io.micrometer.prometheus.PrometheusMeterRegistry
import org.koin.ktor.ext.inject

fun Application.configureMonitoring() {
    val serviceMetrics by inject<ServiceMetrics>()
    val appMicrometerRegistry = PrometheusMeterRegistry(PrometheusConfig.DEFAULT)
    serviceMetrics.init(appMicrometerRegistry)

    install(MicrometerMetrics) {
        registry = appMicrometerRegistry
    }
    install(CallLogging)
}
