package com.sashaflake.graphql

import com.sashaflake.module
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldNotBeEmpty
import io.ktor.client.HttpClient
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.serialization.jackson.jackson
import io.ktor.server.config.MapApplicationConfig
import io.ktor.server.testing.TestApplication
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.koin.core.context.stopKoin

// Замени на интеграционный тест своей мутации
class ExampleMutationTest : DescribeSpec({

    lateinit var app: TestApplication
    lateinit var client: HttpClient

    beforeSpec {
        app = TestApplication {
            environment {
                config = MapApplicationConfig(
                    "jwt.secret" to "test-secret-key-for-testing-only-minimum-32-chars",
                    "jwt.issuer" to "test-issuer",
                    "jwt.audience" to "test-audience",
                    // TODO: добавить конфигурацию
                )
            }
            application { module() }
        }
        app.start()
        client = app.createClient {
            install(ContentNegotiation) { jackson() }
        }
    }

    afterSpec {
        client.close()
        app.stop()
        stopKoin()
    }

    fun graphqlBody(query: String): Map<String, String> = mapOf("query" to query)

    describe("createExample mutation") {
        it("returns id on successful creation") {
            val response = client.post("/graphql") {
                contentType(ContentType.Application.Json)
                setBody(
                    graphqlBody(
                        """
                        mutation {
                            createExample(name: "test") {
                                success id error
                            }
                        }
                        """.trimIndent()
                    )
                )
            }

            response.status shouldBe HttpStatusCode.OK
            val data = Json.parseToJsonElement(response.bodyAsText())
                .jsonObject["data"]!!
                .jsonObject["createExample"]!!
                .jsonObject
            data["success"]!!.jsonPrimitive.boolean shouldBe true
            data["id"]!!.jsonPrimitive.content.shouldNotBeEmpty()
        }

        // TODO: добавить тесты на ошибки
    }
})
