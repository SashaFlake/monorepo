package com.sashaflake.infrastructure.di

import auth.command.LoginUserHandler
import auth.command.RegisterUserHandler
import auth.command.RequestPasswordResetHandler
import auth.command.ResetPasswordHandler
import auth.port.EmailSender
import auth.port.IdGenerator
import auth.port.PasswordHasher
import auth.port.PasswordResetTokenGenerator
import auth.port.PasswordResetTokenRepository
import auth.port.TokenIssuer
import auth.port.UserRepository
import com.sashaflake.infrastructure.adapter.BCryptPasswordHasher
import com.sashaflake.infrastructure.adapter.StubEmailSender
import com.sashaflake.infrastructure.adapter.UuidIdGenerator
import com.sashaflake.infrastructure.adapter.UuidPasswordResetTokenGenerator
import com.sashaflake.infrastructure.metrics.AuthMetrics
import com.sashaflake.infrastructure.persistence.dragonfly.DragonflyPasswordResetTokenRepository
import com.sashaflake.infrastructure.persistence.dragonfly.DragonflyUserRepository
import io.ktor.server.application.Application
import io.lettuce.core.RedisClient
import io.lettuce.core.api.StatefulRedisConnection
import io.lettuce.core.api.async.RedisAsyncCommands
import org.koin.dsl.module

object AppModule {
    fun create() =
        module {
            single<RedisClient> {
                val application = get<Application>()
                val redisUrl = application.environment.config.property("redis.url").getString()
                RedisClient.create(redisUrl)
            }

            single<StatefulRedisConnection<String, String>> {
                get<RedisClient>().connect()
            }

            single<RedisAsyncCommands<String, String>> {
                get<StatefulRedisConnection<String, String>>().async()
            }

            single<UserRepository> {
                DragonflyUserRepository(get())
            }

            single<PasswordResetTokenRepository> {
                DragonflyPasswordResetTokenRepository(get())
            }

            single<PasswordHasher> { BCryptPasswordHasher() }
            single<IdGenerator> { UuidIdGenerator() }
            single<TokenIssuer> {
                val application = get<Application>()
                val secret = application.environment.config.property("jwt.secret").getString()
                val issuer = application.environment.config.property("jwt.issuer").getString()
                com.sashaflake.infrastructure.adapter.JwtTokenIssuer(secret, issuer)
            }
            single<EmailSender> { StubEmailSender() }
            single<PasswordResetTokenGenerator> { UuidPasswordResetTokenGenerator() }

            single { AuthMetrics() }

            single { LoginUserHandler(get(), get(), get()) }
            single { RegisterUserHandler(get(), get(), get()) }
            single { RequestPasswordResetHandler(get(), get(), get(), get()) }
            single { ResetPasswordHandler(get(), get(), get()) }
        }
}
