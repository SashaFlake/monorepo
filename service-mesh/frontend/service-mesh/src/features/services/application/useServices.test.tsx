import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode, ReactElement } from 'react'
import { useServices } from './useServices.application'
import type { ServiceView } from '../domain/services.types'

vi.mock('../infrastructure/services.infrastructure', () => ({
  servicesApi: { listServices: vi.fn() },
  servicesKeys: { list: () => ['registry', 'list'] as const },
}))

import { servicesApi } from '../infrastructure/services.infrastructure'

const mockedListServices = vi.mocked(servicesApi.listServices)

function wrapper({ children }: { children: ReactNode }): ReactElement {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useServices', () => {
  it('returns loading state initially', () => {
    mockedListServices.mockResolvedValue([])
    const { result } = renderHook(() => useServices(), { wrapper })
    expect(result.current.isLoading).toBe(true)
  })

  it('returns service list on success', async () => {
    const data: ServiceView[] = [
      { id: 'svc-1', name: 'auth', labels: {}, registeredAt: '', instances: [], worstStatus: 'passing' },
    ]
    mockedListServices.mockResolvedValue(data)

    const { result } = renderHook(() => useServices(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(data)
  })

  it('returns error state on failure', async () => {
    mockedListServices.mockRejectedValue(new Error('network'))
    const { result } = renderHook(() => useServices(), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
