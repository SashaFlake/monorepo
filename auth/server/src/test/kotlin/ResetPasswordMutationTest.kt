import io.kotest.core.spec.style.ShouldSpec
import io.kotest.matchers.shouldBe
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.server.testing.testApplication

class ResetPasswordMutationTest : ShouldSpec({

    fun testApp(block: suspend io.ktor.client.HttpClient.() -> Unit) = testApplication {
        application { testModule() }
        val client = createClient {
            install(io.ktor.client.plugins.contentnegotiation.ContentNegotiation) {
                io.ktor.serialization.jackson.jackson()
            }
        }
        client.block()
    }

    should("request password reset without error for existing user") {
        testApp {
            post("/graphql") {
                contentType(ContentType.Application.Json)
                setBody(mapOf("query" to """
                    mutation { register(email: "reset@example.com", password: "Password1") { __typename } }
                """.trimIndent()))
            }

            val response = post("/graphql") {
                contentType(ContentType.Application.Json)
                setBody(mapOf("query" to """
                    mutation { requestPasswordReset(email: "reset@example.com") { ... on RequestPasswordResetSuccess { __typename } } }
                """.trimIndent()))
            }

            response.status shouldBe HttpStatusCode.OK
        }
    }

    should("succeed silently for unknown email on password reset request") {
        testApp {
            val response = post("/graphql") {
                contentType(ContentType.Application.Json)
                setBody(mapOf("query" to """
                    mutation { requestPasswordReset(email: "ghost@example.com") { ... on RequestPasswordResetSuccess { __typename } } }
                """.trimIndent()))
            }

            response.status shouldBe HttpStatusCode.OK
        }
    }

    should("return error for invalid reset token") {
        testApp {
            val response = post("/graphql") {
                contentType(ContentType.Application.Json)
                setBody(mapOf("query" to """
                    mutation { resetPassword(token: "invalid-token", newPassword: "NewPass1") { ... on ResetPasswordError { message } } }
                """.trimIndent()))
            }

            response.status shouldBe HttpStatusCode.OK
            response.bodyAsText().contains("Token not found") shouldBe true
        }
    }
})
