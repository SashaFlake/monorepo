package com.sashaflake.presentation.graphql

import auth.command.LoginUserCommand
import auth.command.LoginUserHandler
import auth.command.RegisterUserCommand
import auth.command.RegisterUserHandler
import auth.command.RequestPasswordResetCommand
import auth.command.RequestPasswordResetHandler
import auth.command.ResetPasswordCommand
import auth.command.ResetPasswordHandler
import com.expediagroup.graphql.server.operations.Mutation
import com.sashaflake.infrastructure.metrics.AuthMetrics
import org.koin.core.annotation.Single

@Single
class AuthMutation(
    private val loginUserHandler: LoginUserHandler,
    private val registerUserHandler: RegisterUserHandler,
    private val requestPasswordResetHandler: RequestPasswordResetHandler,
    private val resetPasswordHandler: ResetPasswordHandler,
    private val authMetrics: AuthMetrics,
) : Mutation {
    suspend fun login(email: String, password: String): LoginResult {
        authMetrics.recordLoginAttempt()
        return authMetrics.getLoginTimer().recordSuspend {
            loginUserHandler.handle(LoginUserCommand(email, password)).fold(
                ifLeft = { error ->
                    authMetrics.recordLoginFailure()
                    when (error) {
                        LoginUserHandler.Error.UserNotFound -> LoginResult(success = false, error = "User not found")
                        LoginUserHandler.Error.InvalidPassword -> LoginResult(success = false, error = "Invalid password")
                        LoginUserHandler.Error.AccountLocked -> LoginResult(success = false, error = "Account locked")
                    }
                },
                ifRight = { token ->
                    authMetrics.recordLoginSuccess()
                    LoginResult(success = true, token = token)
                },
            )
        }
    }

    suspend fun register(email: String, password: String): RegisterResult {
        authMetrics.recordRegisterAttempt()
        return authMetrics.getRegisterTimer().recordSuspend {
            registerUserHandler.handle(RegisterUserCommand(email, password)).fold(
                ifLeft = { error ->
                    authMetrics.recordRegisterFailure()
                    when (error) {
                        RegisterUserHandler.Error.UserAlreadyExists -> RegisterResult(success = false, error = "User already exists")
                        RegisterUserHandler.Error.InvalidEmail -> RegisterResult(success = false, error = "Invalid email")
                        RegisterUserHandler.Error.InvalidPassword -> RegisterResult(success = false, error = "Invalid password")
                    }
                },
                ifRight = {
                    authMetrics.recordRegisterSuccess()
                    RegisterResult(success = true)
                },
            )
        }
    }

    suspend fun requestPasswordReset(email: String): RequestPasswordResetResult {
        authMetrics.recordPasswordResetRequest()
        return authMetrics.getPasswordResetTimer().recordSuspend {
            requestPasswordResetHandler.handle(RequestPasswordResetCommand(email)).fold(
                ifLeft = {
                    authMetrics.recordPasswordResetFailure()
                    RequestPasswordResetResult(success = false, error = "User not found")
                },
                ifRight = {
                    authMetrics.recordPasswordResetSuccess()
                    RequestPasswordResetResult(success = true)
                },
            )
        }
    }

    suspend fun resetPassword(token: String, newPassword: String): ResetPasswordResult {
        return resetPasswordHandler.handle(ResetPasswordCommand(token, newPassword)).fold(
            ifLeft = { error ->
                when (error) {
                    ResetPasswordHandler.Error.TokenNotFound -> ResetPasswordResult(success = false, error = "Token not found")
                    ResetPasswordHandler.Error.TokenExpired -> ResetPasswordResult(success = false, error = "Token expired")
                    ResetPasswordHandler.Error.UserNotFound -> ResetPasswordResult(success = false, error = "User not found")
                    ResetPasswordHandler.Error.InvalidPassword -> ResetPasswordResult(success = false, error = "Invalid password")
                }
            },
            ifRight = { ResetPasswordResult(success = true) },
        )
    }
}

data class LoginResult(val success: Boolean, val token: String? = null, val error: String? = null)
data class RegisterResult(val success: Boolean, val error: String? = null)
data class RequestPasswordResetResult(val success: Boolean, val error: String? = null)
data class ResetPasswordResult(val success: Boolean, val error: String? = null)
