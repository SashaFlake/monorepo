package com.sashaflake.infrastructure.graphql

import com.expediagroup.graphql.server.ktor.DefaultKtorGraphQLContextFactory
import com.sashaflake.infrastructure.plugins.AuthPrincipal
import graphql.GraphQLContext
import io.ktor.server.auth.principal
import io.ktor.server.request.ApplicationRequest

class KtorGraphQLContextFactory : DefaultKtorGraphQLContextFactory() {
    override suspend fun generateContext(request: ApplicationRequest): GraphQLContext {
        val base = super.generateContext(request)
        val principal = request.call.principal<AuthPrincipal>()
        return GraphQLContext.newContext()
            .of(base.toMap())
            .put("principal", principal)
            .build()
    }
}
