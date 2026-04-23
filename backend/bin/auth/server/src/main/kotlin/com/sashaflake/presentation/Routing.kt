package com.sashaflake.presentation

import com.sashaflake.presentation.routes.metricsRoutes
import io.ktor.server.application.Application
import io.ktor.server.routing.routing

fun Application.configureRouting() {
    routing {
        metricsRoutes()
    }
}
