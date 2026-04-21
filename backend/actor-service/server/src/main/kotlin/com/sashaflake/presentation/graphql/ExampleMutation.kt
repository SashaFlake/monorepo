package com.sashaflake.presentation.graphql

import __PACKAGE__.command.CreateExampleCommand
import __PACKAGE__.command.CreateExampleHandler
import com.expediagroup.graphql.server.operations.Mutation
import com.sashaflake.infrastructure.metrics.ServiceMetrics
import org.koin.core.annotation.Single

// Замени Example на имя своей сущности
@Single
class ExampleMutation(
    private val createExampleHandler: CreateExampleHandler,
    private val metrics: ServiceMetrics,
) : Mutation {

    suspend fun createExample(name: String): CreateExampleResult {
        metrics.recordCreateAttempt()
        return metrics.getCreateTimer().recordSuspend {
            createExampleHandler.handle(CreateExampleCommand(name = name)).fold(
                ifLeft = { error ->
                    metrics.recordCreateFailure()
                    when (error) {
                        CreateExampleHandler.Error.AlreadyExists ->
                            CreateExampleResult(success = false, error = "Already exists")
                    }
                },
                ifRight = { example ->
                    metrics.recordCreateSuccess()
                    CreateExampleResult(success = true, id = example.id.toString())
                },
            )
        }
    }
}

data class CreateExampleResult(
    val success: Boolean,
    val id: String? = null,
    val error: String? = null,
)
