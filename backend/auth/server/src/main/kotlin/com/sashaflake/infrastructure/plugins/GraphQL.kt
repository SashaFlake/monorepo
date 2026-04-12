package com.sashaflake.infrastructure.plugins

import com.expediagroup.graphql.server.ktor.GraphQL
import com.expediagroup.graphql.server.ktor.graphQLPostRoute
import com.expediagroup.graphql.server.ktor.graphQLSDLRoute
import com.expediagroup.graphql.server.ktor.graphiQLRoute
import com.sashaflake.infrastructure.graphql.KtorGraphQLContextFactory
import com.sashaflake.presentation.graphql.AuthMutation
import com.sashaflake.presentation.graphql.HealthQuery
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.routing.routing
import org.koin.ktor.ext.inject

fun Application.configureGraphQL() {
    val authMutation by inject<AuthMutation>()
    val healthQuery by inject<HealthQuery>()

    install(GraphQL) {
        schema {
            packages = listOf("com.sashaflake")
            queries = listOf(healthQuery)
            mutations = listOf(authMutation)
        }
        server {
            contextFactory = KtorGraphQLContextFactory()
        }
    }

    routing {
        graphQLPostRoute()
        graphiQLRoute()
        graphQLSDLRoute()
    }
}
