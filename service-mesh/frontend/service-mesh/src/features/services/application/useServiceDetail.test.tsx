import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useServiceDetail } from './useServiceDetail.application'
import type { ServiceVersionsResponse } from '../domain/services.types'

vi.mock('../infrastructure/services.infrastructure', () => ({
  servicesApi: { getServiceVersions: vi.fn() },
  servicesKeys: { versions: (id: string) => ['registry', 'versions', id] as const },
}))

import { servicesApi } from '../infrastructure/services.infrastructure'

const mockedGetServiceVersions = vi.mocked(servicesApi.getServiceVersions)

function wrapper({ children }: { children: ReactNode }): ReactElement {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useServiceDetail', () => {
  it('returns loading state initially', () => {
    mockedGetServiceVersions.mockResolvedValue({ serviceId: 'svc-1', serviceName: 'auth', versions: [] })
    const { result } = renderHook(() => useServiceDetail('svc-1'), { wrapper })
    expect(result.current.isLoading).toBe(true)
  })

  it('returns versions on success', async () => {
    const data: ServiceVersionsResponse = {
      serviceId: 'svc-1',
      serviceName: 'auth',
      versions: [{ version: 'v1', instanceCount: 2, instances: [], manifest: {} as never }],
    }
    mockedGetServiceVersions.mockResolvedValue(data)

    const { result } = renderHook(() => useServiceDetail('svc-1'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(data)
    expect(mockedGetServiceVersions).toHaveBeenCalledWith('svc-1')
  })

  it('returns error state on failure', async () => {
    mockedGetServiceVersions.mockRejectedValue(new Error('network'))
    const { result } = renderHook(() => useServiceDetail('svc-1'), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
