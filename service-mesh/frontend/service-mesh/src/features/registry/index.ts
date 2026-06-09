/**
 * Public API of the `registry-ui` bounded context.
 *
 * Exports the dashboard page, the services table, and the TypeScript types
 * consumed by the dashboard shell.
 */
export { RegistryDashboard } from './ui/RegistryDashboard/RegistryDashboard'
export { ServicesTable } from './ui/ServicesTable/ServicesTable'
export type { RegistryStats, UseRegistryStatsResult } from './domain/registry.types'
