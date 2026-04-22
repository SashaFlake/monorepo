export type RegistryErrorCode =
  | 'INSTANCE_NOT_FOUND'
  | 'SERVICE_NOT_FOUND'
  | 'VALIDATION_ERROR'

export type RegistryError = {
  readonly code:    RegistryErrorCode
  readonly message: string
}

export const registryError = (
  code: RegistryErrorCode,
  message: string,
): RegistryError => ({ code, message })
