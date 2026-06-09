import { describe, it, expect, vi } from 'vitest'

vi.mock('@tanstack/react-query-persist-client', () => ({
  persistQueryClient: vi.fn(),
}))

import { QueryClient } from '@tanstack/react-query'
import { queryClient } from './queryClient'

describe('queryClient', () => {
  it('is a QueryClient instance', () => {
    expect(queryClient).toBeInstanceOf(QueryClient)
  })

  it('has expected default query options', () => {
    const defaults = queryClient.getDefaultOptions().queries
    expect(defaults?.staleTime).toBe(30_000)
    expect(defaults?.gcTime).toBe(1_000 * 60 * 60)
    expect(defaults?.retry).toBe(2)
    expect(defaults?.refetchOnWindowFocus).toBe(true)
  })
})
