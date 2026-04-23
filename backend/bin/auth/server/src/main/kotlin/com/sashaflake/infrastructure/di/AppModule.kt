package com.sashaflake.infrastructure.di

import EmailSender
import IdGenerator
import auth.command.LoginUserHandler
import auth.command.RegisterUserHandler
import auth.command.RequestPasswordResetHandler
import auth.command.ResetPasswordHandler
import auth.port.PasswordHasher
import auth.port.PasswordResetTokenGenerator
import auth.port.PasswordResetTokenRepository
import auth.port.TokenIssuer
import auth.port.UserRepository
import com.sashaflake.infrastructure.adapter.BCryptPasswordHasher
import com.sashaflake.infrastructure.adapter.InMemoryPasswordResetTokenRepository
import com.sashaflake.infrastructure.adapter.InMemoryUserRepository
import com.sashaflake.infrastructure.adapter.JwtTokenIssuer
import com.sashaflake.infrastructure.adapter.StubEmailSender
import com.sashaflake.infrastructure.adapter.UuidIdGenerator
import com.sashaflake.infrastructure.adapter.UuidPasswordResetTokenGenerator
import com.sashaflake.infrastructure.metrics.AuthMetrics
import com.sashaflake.infrastructure.persistence.dragonfly.DragonflyPasswordResetTokenRepository
import com.sashaflake.infrastructure.persistence.dragonfly.DragonflyUserRepository
import com.sashaflake.infrastructure.plugins.appMicrometerRegistry
import io.ktor.server.application.Application
import io.lettuce.core.ExperimentalLettuceCoroutinesApi
import io.lettuce.core.RedisClient
import io.lettuce.core.api.StatefulRedisConnection
import org.koin.dsl.module
import org.koin.dsl.onClose
import java.time.Clock

@OptIn(ExperimentalLettuceCoroutinesApi::class)
fun appModule(app: Application) =
    module {
        single<PasswordHasher> { BCryptPasswordHasher() }
        single<EmailSender> { StubEmailSender() }
        single<PasswordResetTokenGenerator> { UuidPasswordResetTokenGenerator() }
        single<IdGenerator> { UuidIdGenerator() }
        single<Clock> { Clock.systemUTC() }
        single<TokenIssuer> {
            JwtTokenIssuer(
                secret = app.environment.config.property("jwt.secret").getString(),
                issuer = app.environment.config.property("jwt.issuer").getString(),
                audience = app.environment.config.property("jwt.audience").getString(),
            )
        }
        single<StatefulRedisConnection<String, String>> {
            val uri = app.environment.config.property("dragonfly.uri").getString()
            RedisClient.create(uri).connect()
        } onClose { it?.close() }
        single<UserRepository> {
            val useInMemory = app.environment.config.propertyOrNull("storage.inMemory")?.getString()?.toBoolean() ?: false
            if (useInMemory) InMemoryUserRepository()
            else DragonflyUserRepository(get(), get())
        }
        single<PasswordResetTokenRepository> {
            val useInMemory = app.environment.config.propertyOrNull("storage.inMemory")?.getString()?.toBoolean() ?: false
            if (useInMemory) InMemoryPasswordResetTokenRepository()
            else DragonflyPasswordResetTokenRepository(get(), get())
        }
        single { AuthMetrics(app.appMicrometerRegistry) }
        single {
            LoginUserHandler(
                users = get(),
                hasher = get(),
                tokenIssuer = get(),
                clock = get(),
            )
        }
        single {
            RegisterUserHandler(
                users = get(),
                hasher = get(),
                clock = get(),
                idGenerator = get(),
            )
        }
        single {
            RequestPasswordResetHandler(
                users = get(),
                tokens = get(),
                emailSender = get(),
                tokenGenerator = get(),
                clock = get(),
            )
        }
        single {
            ResetPasswordHandler(
                users = get(),
                tokens = get(),
                hasher = get(),
                clock = get(),
            )
        }
    }
