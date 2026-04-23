package com.sashaflake.presentation.routes

import com.sashaflake.infrastructure.plugins.appMicrometerRegistry
import io.ktor.http.ContentType
import io.ktor.server.application.application
import io.ktor.server.response.respondText
import io.ktor.server.routing.Route
import io.ktor.server.routing.get

fun Route.metricsRoutes() {
    get("/metrics") {
        val registry = call.application.appMicrometerRegistry
        call.respondText(registry.scrape(), ContentType.Text.Plain)
    }
}
