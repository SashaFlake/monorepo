import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useRegistryStats } from './useRegistryStats.application'
import type { ServiceView } from '@/features/services'

vi.mock('../infrastructure/registry.infrastructure', () => ({
  registryApi: { listServices: vi.fn() },
  registryKeys: { list: () => ['registry', 'list'] as const },
}))

import { registryApi } from '../infrastructure/registry.infrastructure'

const mockedListServices = vi.mocked(registryApi.listServices)

function wrapper({ children }: { children: ReactNode }): ReactElement {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const service = (overrides: Partial<ServiceView> = {}): ServiceView => ({
  id: 'svc-1',
  name: 'auth',
  labels: {},
  registeredAt: '2026-01-01T00:00:00Z',
  instances: [],
  worstStatus: 'passing',
  ...overrides,
})

describe('useRegistryStats', () => {
  it('returns loading state initially', () => {
    mockedListServices.mockResolvedValue([])
    const { result } = renderHook(() => useRegistryStats(), { wrapper })
    expect(result.current.isLoading).toBe(true)
    expect(result.current.stats.totalServices).toBe(0)
  })

  it('computes stats from services', async () => {
    mockedListServices.mockResolvedValue([
      service({
        instances: [
          { id: 'i1', serviceId: 'svc-1', host: 'h1', port: 80, healthPath: '/health', metadata: {}, registeredAt: '', lastHeartbeatAt: '', lastHealthCheck: null, status: 'passing' },
          { id: 'i2', serviceId: 'svc-1', host: 'h2', port: 80, healthPath: '/health', metadata: {}, registeredAt: '', lastHeartbeatAt: '', lastHealthCheck: null, status: 'critical' },
        ],
      }),
      service({ id: 'svc-2', instances: [{ id: 'i3', serviceId: 'svc-2', host: 'h3', port: 80, healthPath: '/health', metadata: {}, registeredAt: '', lastHeartbeatAt: '', lastHealthCheck: null, status: 'warning' }] }),
    ])

    const { result } = renderHook(() => useRegistryStats(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.stats.totalServices).toBe(2)
    expect(result.current.stats.totalInstances).toBe(3)
    expect(result.current.stats.passingInstances).toBe(1)
    expect(result.current.stats.degradedInstances).toBe(1)
    expect(result.current.stats.criticalInstances).toBe(1)
  })

  it('returns error state when query fails', async () => {
    mockedListServices.mockRejectedValue(new Error('network'))
    const { result } = renderHook(() => useRegistryStats(), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.stats.totalServices).toBe(0)
  })

  it('returns empty array when data is undefined', async () => {
    mockedListServices.mockResolvedValue(undefined as unknown as ServiceView[])
    const { result } = renderHook(() => useRegistryStats(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.services).toEqual([])
  })
})
