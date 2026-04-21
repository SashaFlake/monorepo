package com.sashaflake.infrastructure.actor

// CircuitBreakerMessage перенесён в domain-модуль:
// com.sashaflake.circuitbreaker.model.CircuitBreakerMessage
//
// Это позволяет reduce() оставаться чистой функцией домена
// без зависимости на инфраструктурные модули.
