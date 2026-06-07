/**
 * Public infrastructure surface of the `registry-ui` bounded context.
 *
 * Currently re-exports the services API client and query keys from the
 * `services` context because the registry dashboard consumes the same
 * `/services` endpoint. Future iterations may split this into a dedicated
 * registry aggregate endpoint.
 *
 * @sideEffects none at import time; delegated HTTP I/O to the re-exported client.
 */
export { servicesApi as registryApi, servicesKeys as registryKeys } from '@/features/services/infrastructure/services.infrastructure'
