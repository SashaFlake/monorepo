import { useServicesList } from '@/features/services/api/useServicesList'
import type { ServiceView } from '@/features/services/api/types'

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

const EMPTY_STATS: RegistryStats = {
  totalServices:     0,
  totalInstances:    0,
  passingInstances:  0,
  degradedInstances: 0,
  criticalInstances: 0,
}

const calcStats = (services: ServiceView[]): RegistryStats => {
  const instances = services.flatMap(s => s.instances)
  return {
    totalServices:     services.length,
    totalInstances:    instances.length,
    passingInstances:  instances.filter(i => i.status === 'passing').length,
    degradedInstances: instances.filter(i => i.status === 'warning').length,
    criticalInstances: instances.filter(i => i.status === 'critical').length,
  }
}

export function useRegistryStats(): UseRegistryStatsResult {
  const { services, isLoading, isError, updatedAt: dataUpdatedAt } = useServicesList()

  return {
    stats:     isLoading ? EMPTY_STATS : calcStats(services),
    services,
    isLoading,
    isError,
    updatedAt: dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : null,
  }
}
