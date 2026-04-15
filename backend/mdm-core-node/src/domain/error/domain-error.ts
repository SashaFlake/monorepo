export type DomainErrorCode = string;

export interface DomainError {
  readonly code: DomainErrorCode;
  readonly message: string;
  readonly context?: Record<string, unknown>;
}

export const domainError = (
  code: DomainErrorCode,
  message: string,
  context?: Record<string, unknown>,
): DomainError => ({ code, message, context });
