import io.kotest.core.spec.style.ShouldSpec
import io.kotest.matchers.shouldBe
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.server.testing.testApplication

class RegisterUserMutationTest : ShouldSpec({

    fun testApp(block: suspend io.ktor.client.HttpClient.() -> Unit) = testApplication {
        application { testModule() }
        val client = createClient {
            install(io.ktor.client.plugins.contentnegotiation.ContentNegotiation) {
                io.ktor.serialization.jackson.jackson()
            }
        }
        client.block()
    }

    should("register user successfully") {
        testApp {
            val response = post("/graphql") {
                contentType(ContentType.Application.Json)
                setBody(mapOf("query" to """
                    mutation { register(email: "new@example.com", password: "Password1") { ... on RegisterSuccess { __typename } ... on RegisterError { message } } }
                """.trimIndent()))
            }

            response.status shouldBe HttpStatusCode.OK
            response.bodyAsText().contains("RegisterSuccess") shouldBe true
        }
    }

    should("return error for duplicate registration") {
        testApp {
            val body = mapOf("query" to """
                mutation { register(email: "dup@example.com", password: "Password1") { ... on RegisterError { message } } }
            """.trimIndent())

            post("/graphql") { contentType(ContentType.Application.Json); setBody(body) }
            val response = post("/graphql") { contentType(ContentType.Application.Json); setBody(body) }

            response.status shouldBe HttpStatusCode.OK
            response.bodyAsText().contains("User already exists") shouldBe true
        }
    }

    should("return error for invalid email") {
        testApp {
            val response = post("/graphql") {
                contentType(ContentType.Application.Json)
                setBody(mapOf("query" to """
                    mutation { register(email: "not-an-email", password: "Password1") { ... on RegisterError { message } } }
                """.trimIndent()))
            }

            response.status shouldBe HttpStatusCode.OK
            response.bodyAsText().contains("Invalid email") shouldBe true
        }
    }
})
