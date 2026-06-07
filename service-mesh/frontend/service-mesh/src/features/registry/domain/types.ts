import type { ServiceView } from '@/features/services/domain/types'

export type RegistryStats = {
  totalServices:     number
  totalInstances:    number
  passingInstances:  number
  degradedInstances: number
  criticalInstances: number
}

export type UseRegistryStatsResult = {
  stats:     RegistryStats
  services:  ServiceView[]
  isLoading: boolean
  isError:   boolean
  updatedAt: string | null
}
