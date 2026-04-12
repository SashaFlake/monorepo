package com.sashaflake.infrastructure.adapter

import auth.model.user.Email
import auth.port.EmailSender
import org.slf4j.LoggerFactory

class StubEmailSender : EmailSender {
    private val logger = LoggerFactory.getLogger(StubEmailSender::class.java)

    override suspend fun send(to: Email, subject: String, body: String) {
        logger.info("[STUB] Sending email to ${to.value}: $subject\n$body")
    }
}
