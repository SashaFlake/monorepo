package com.sashaflake.presentation

import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.routing
import org.koin.ktor.ext.inject

fun Application.configureRouting() {
    val handler by inject<CircuitBreakerHandler>()

    routing {
        // Проверка жизни
        get("/health") {
            call.respond(mapOf("status" to "ok"))
        }

        /**
         * POST /call
         * Body: { "serviceId": "sms-provider" }
         *
         * Прогоняет фейковый вызов через Circuit Breaker для данного serviceId.
         * Вызывайте несколько раз подряд — увидите переход CLOSED → OPEN → HALF_OPEN → CLOSED.
         */
        post("/call") {
            val request = call.receive<CircuitBreakerHandler.CallRequest>()
            val response = handler.call(request)
            val status = if (response.result == "REJECTED") HttpStatusCode.ServiceUnavailable else HttpStatusCode.OK
            call.respond(status, response)
        }
    }
}
