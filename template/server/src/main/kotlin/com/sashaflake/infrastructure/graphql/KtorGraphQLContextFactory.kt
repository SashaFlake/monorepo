package com.sashaflake.infrastructure.graphql

import com.expediagroup.graphql.server.ktor.DefaultKtorGraphQLContextFactory
import com.expediagroup.graphql.server.types.GraphQLServerRequest
import graphql.GraphQLContext
import io.ktor.server.request.ApplicationRequest

class KtorGraphQLContextFactory : DefaultKtorGraphQLContextFactory() {
    override suspend fun generateContext(
        request: ApplicationRequest,
        graphQLRequest: GraphQLServerRequest,
    ): GraphQLContext {
        val base = super.generateContext(request, graphQLRequest)
        val token = request.headers["Authorization"]?.removePrefix("Bearer ")
        return GraphQLContext.newContext()
            .of(base)
            .put("token", token)
            .build()
    }
}
