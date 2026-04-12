package com.sashaflake.presentation.routes

import io.ktor.server.application.call
import io.ktor.server.response.respondText
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.micrometer.prometheus.PrometheusMeterRegistry

fun Route.metricsRoutes() {
    get("/metrics") {
        val registry = call.application.attributes[io.ktor.server.metrics.micrometer.MicrometerMetrics.Key]
        call.respondText(registry.toString())
    }
}
