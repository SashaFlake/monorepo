/**
 * Public API of the `services-ui` bounded context.
 *
 * Exports the services list page, service detail page, public domain types,
 * the REST client, query keys, and the TanStack Query hooks used by routes.
 */
export { ServicesPage } from './ui/ServicesPage/ServicesPage'
export { ServiceDetailPage } from './ui/ServiceDetailPage/ServiceDetailPage'
export type { ServiceView, InstanceStatus } from './domain/types'
export { servicesApi, servicesKeys } from './infrastructure/services.infrastructure'
export { useServices } from './application/useServices.application'
export { useServiceDetail } from './application/useServiceDetail.application'
