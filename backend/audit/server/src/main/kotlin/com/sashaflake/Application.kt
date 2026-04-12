package com.sashaflake

import com.sashaflake.infrastructure.di.AppModule
import com.sashaflake.infrastructure.plugins.configureGraphQL
import com.sashaflake.infrastructure.plugins.configureHTTP
import com.sashaflake.infrastructure.plugins.configureMonitoring
import com.sashaflake.infrastructure.plugins.configureSecurity
import com.sashaflake.infrastructure.plugins.configureSerialization
import com.sashaflake.presentation.configureRouting
import io.ktor.server.application.Application
import io.ktor.server.netty.EngineMain
import org.koin.ktor.plugin.Koin

fun main(args: Array<String>): Unit = EngineMain.main(args)

fun Application.module() {
    install(Koin) {
        modules(AppModule.create())
    }
    configureSerialization()
    configureSecurity()
    configureMonitoring()
    configureHTTP()
    configureGraphQL()
    configureRouting()
}
