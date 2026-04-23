package com.sashaflake.presentation.graphql

import auth.command.LoginUserCommand
import auth.command.LoginUserError
import auth.command.LoginUserHandler
import auth.command.RegisterUserCommand
import auth.command.RegisterUserError
import auth.command.RegisterUserHandler
import auth.command.RequestPasswordResetCommand
import auth.command.RequestPasswordResetHandler
import auth.command.ResetPasswordCommand
import auth.command.ResetPasswordHandler
import com.expediagroup.graphql.server.operations.Mutation
import com.sashaflake.infrastructure.metrics.AuthMetrics

class AuthMutation(
    private val loginHandler: LoginUserHandler,
    private val registerHandler: RegisterUserHandler,
    private val requestResetHandler: RequestPasswordResetHandler,
    private val resetPasswordHandler: ResetPasswordHandler,
    private val metrics: AuthMetrics,
) : Mutation {
    suspend fun login(
        email: String,
        password: String,
    ): LoginResult {
        metrics.loginAttempts.increment()
        return metrics.loginTimer.recordSuspend {
            loginHandler
                .handle(LoginUserCommand(email, password))
                .fold(
                    ifLeft = { error ->
                        metrics.loginFailures.increment()
                        LoginResult.Error(
                            when (error) {
                                LoginUserError.InvalidCredentials -> "Invalid credentials"
                                LoginUserError.AccountLocked -> "Account is locked"
                            },
                        )
                    },
                    ifRight = { token ->
                        metrics.loginSuccess.increment()
                        LoginResult.Success(token)
                    },
                )
        }
    }

    suspend fun register(
        email: String,
        password: String,
    ): RegisterResult {
        metrics.registerAttempts.increment()
        return registerHandler
            .handle(RegisterUserCommand(email, password))
            .fold(
                ifLeft = { error ->
                    metrics.registerFailures.increment()
                    RegisterResult.Error(
                        when (error) {
                            RegisterUserError.UserAlreadyExists -> "User already exists"
                            RegisterUserError.InvalidEmail -> "Invalid email"
                            RegisterUserError.UserCreationFailed -> "User creation failed"
                        },
                    )
                },
                ifRight = {
                    metrics.registerSuccess.increment()
                    RegisterResult.Success
                },
            )
    }

    suspend fun requestPasswordReset(email: String): RequestPasswordResetResult {
        metrics.passwordResetRequests.increment()
        return requestResetHandler
            .handle(RequestPasswordResetCommand(email))
            .fold(
                ifLeft = { RequestPasswordResetResult.Error("Failed to process request") },
                ifRight = { RequestPasswordResetResult.Success },
            )
    }

    suspend fun resetPassword(
        token: String,
        newPassword: String,
    ): ResetPasswordResult {
        return resetPasswordHandler
            .handle(ResetPasswordCommand(token, newPassword))
            .fold(
                ifLeft = { error ->
                    metrics.passwordResetFailures.increment()
                    ResetPasswordResult.Error(
                        when (error) {
                            auth.command.ResetPasswordError.TokenNotFound -> "Token not found"
                            auth.command.ResetPasswordError.TokenExpired -> "Token expired"
                            auth.command.ResetPasswordError.UserNotFound -> "User not found"
                            auth.command.ResetPasswordError.WeakPassword -> "Password too weak"
                            auth.command.ResetPasswordError.SaveFailed -> "Save failed"
                        },
                    )
                },
                ifRight = {
                    metrics.passwordResetSuccess.increment()
                    ResetPasswordResult.Success
                },
            )
    }
}

sealed class LoginResult {
    data class Success(val token: String) : LoginResult()
    data class Error(val message: String) : LoginResult()
}

sealed class RegisterResult {
    data object Success : RegisterResult()
    data class Error(val message: String) : RegisterResult()
}

sealed class RequestPasswordResetResult {
    data object Success : RequestPasswordResetResult()
    data class Error(val message: String) : RequestPasswordResetResult()
}

sealed class ResetPasswordResult {
    data object Success : ResetPasswordResult()
    data class Error(val message: String) : ResetPasswordResult()
}
