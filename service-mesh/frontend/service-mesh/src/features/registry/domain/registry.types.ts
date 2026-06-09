import type { ServiceView } from '@/features/services'

/**
 * Aggregated health statistics across all registered services.
 *
 * Derived from `ServiceView[]` by counting services and instances,
 * then bucketing instances by their derived status.
 */
export type RegistryStats = {
  /** Number of services returned by the registry. */
  totalServices:     number

  /** Total number of instances across all services. */
  totalInstances:    number

  /** Instances whose status is `passing`. */
  passingInstances:  number

  /** Instances whose status is `warning` or `critical`. */
  degradedInstances: number

  /** Instances whose status is `critical`. */
  criticalInstances: number
}

/**
 * Result shape returned by {@link useRegistryStats}.
 *
 * Combines the raw service list, derived statistics, loading/error flags,
 * and a human-readable timestamp of the last successful update.
 */
export type UseRegistryStatsResult = {
  /** Aggregated statistics; zeroed while loading. */
  stats:     RegistryStats

  /** Raw service list returned by the registry endpoint. */
  services:  ServiceView[]

  /** `true` while the initial query fetch is in progress. */
  isLoading: boolean

  /** `true` if the query failed (e.g. backend unreachable). */
  isError:   boolean

  /** Localised time string of the last successful update, or `null` if none. */
  updatedAt: string | null
}
