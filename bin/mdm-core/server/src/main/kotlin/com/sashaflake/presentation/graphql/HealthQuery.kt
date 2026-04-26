package com.sashaflake.presentation.graphql

import com.expediagroup.graphql.server.operations.Query
import org.koin.core.annotation.Single

@Single
class HealthQuery : Query {
    fun health(): String = "OK"
}
