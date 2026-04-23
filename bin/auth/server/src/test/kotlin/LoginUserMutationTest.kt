import com.sashaflake.infrastructure.adapter.BCryptPasswordHasher
import com.sashaflake.infrastructure.adapter.InMemoryPasswordResetTokenRepository
import com.sashaflake.infrastructure.adapter.InMemoryUserRepository
import com.sashaflake.infrastructure.adapter.JwtTokenIssuer
import com.sashaflake.infrastructure.adapter.StubEmailSender
import com.sashaflake.infrastructure.adapter.UuidIdGenerator
import com.sashaflake.infrastructure.adapter.UuidPasswordResetTokenGenerator
import io.kotest.core.spec.style.ShouldSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldNotBeEmpty
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.server.testing.testApplication

class LoginUserMutationTest : ShouldSpec({

    fun testApp(block: suspend io.ktor.client.HttpClient.() -> Unit) = testApplication {
        application { testModule() }
        val client = createClient {
            install(io.ktor.client.plugins.contentnegotiation.ContentNegotiation) {
                io.ktor.serialization.jackson.jackson()
            }
        }
        client.block()
    }

    should("return token on valid login after registration") {
        testApp {
            post("/graphql") {
                contentType(ContentType.Application.Json)
                setBody(mapOf("query" to """
                    mutation { register(email: "user@example.com", password: "Password1") { ... on RegisterSuccess { __typename } } }
                """.trimIndent()))
            }

            val response = post("/graphql") {
                contentType(ContentType.Application.Json)
                setBody(mapOf("query" to """
                    mutation { login(email: "user@example.com", password: "Password1") { ... on LoginSuccess { token } } }
                """.trimIndent()))
            }

            response.status shouldBe HttpStatusCode.OK
            response.bodyAsText().shouldNotBeEmpty()
        }
    }

    should("return error on invalid credentials") {
        testApp {
            val response = post("/graphql") {
                contentType(ContentType.Application.Json)
                setBody(mapOf("query" to """
                    mutation { login(email: "nobody@example.com", password: "WrongPass1") { ... on LoginError { message } } }
                """.trimIndent()))
            }

            response.status shouldBe HttpStatusCode.OK
            response.bodyAsText().contains("Invalid credentials") shouldBe true
        }
    }
})
