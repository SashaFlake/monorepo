package com.sashaflake.graphql

import auth.command.LoginUserHandler
import auth.model.user.Email
import auth.model.user.HashedPassword
import auth.model.user.LoginAttemptGuard
import auth.model.user.User
import auth.model.user.UserId
import auth.port.PasswordHasher
import auth.port.TokenIssuer
import auth.port.UserRepository
import com.sashaflake.module
import io.kotest.core.spec.style.FunSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldContain
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.server.testing.testApplication
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import java.util.UUID
import org.koin.dsl.module

class LoginUserMutationTest : FunSpec({
    val userRepository = mockk<UserRepository>()
    val passwordHasher = mockk<PasswordHasher>()
    val tokenIssuer = mockk<TokenIssuer>()

    val email = Email.of("test@example.com").getOrNull()!!
    val hashedPassword = HashedPassword.fromTrustedSource("hashedPassword1234567890123456789012345678901234567890")
    val userId = UserId(UUID.randomUUID())
    val user = User(userId, email, hashedPassword, LoginAttemptGuard.initial())

    val testModule = module {
        single { userRepository }
        single { passwordHasher }
        single { tokenIssuer }
        single { LoginUserHandler(get(), get(), get()) }
    }

    context("login mutation") {
        test("successful login returns token") {
            coEvery { userRepository.findByEmail(email) } returns user
            every { passwordHasher.verify(any(), any()) } returns true
            every { tokenIssuer.issue(userId) } returns "jwt-token-123"
            coEvery { userRepository.save(any()) } returns Unit

            testApplication {
                application { module() }
                val response = client.post("/graphql") {
                    header("Content-Type", "application/json")
                    setBody("""{"query": "mutation { login(email: \"test@example.com\", password: \"password123\") { success token error } }"}""".trimIndent())
                }
                response.status shouldBe HttpStatusCode.OK
                val body = response.bodyAsText()
                body shouldContain "\"success\":true"
                body shouldContain "jwt-token-123"
            }
        }

        test("invalid credentials returns error") {
            coEvery { userRepository.findByEmail(email) } returns user
            every { passwordHasher.verify(any(), any()) } returns false
            coEvery { userRepository.save(any()) } returns Unit

            testApplication {
                application { module() }
                val response = client.post("/graphql") {
                    header("Content-Type", "application/json")
                    setBody("""{"query": "mutation { login(email: \"test@example.com\", password: \"wrongpassword\") { success token error } }"}""".trimIndent())
                }
                response.status shouldBe HttpStatusCode.OK
                val body = response.bodyAsText()
                body shouldContain "\"success\":false"
            }
        }
    }
})
