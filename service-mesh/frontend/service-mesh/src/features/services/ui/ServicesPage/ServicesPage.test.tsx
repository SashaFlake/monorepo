import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ServicesPage } from './ServicesPage'

vi.mock('../../application/useServices.application', () => ({
  useServices: vi.fn(),
}))

import { useServices } from '../../application/useServices.application'

const mockedUseServices = vi.mocked(useServices)

describe('ServicesPage', () => {
  it('renders loading state', () => {
    mockedUseServices.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useServices>)

    render(<ServicesPage />)
    expect(screen.getByText('Services')).toBeInTheDocument()
    expect(document.querySelectorAll('tbody tr').length).toBeGreaterThan(0)
  })

  it('renders services list', () => {
    mockedUseServices.mockReturnValue({
      data: [{ id: 'svc-1', name: 'auth', labels: {}, instances: [], worstStatus: 'passing' as const, registeredAt: '' }],
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useServices>)

    render(<ServicesPage />)
    expect(screen.getByText('auth')).toBeInTheDocument()
  })

  it('renders empty state', () => {
    mockedUseServices.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useServices>)

    render(<ServicesPage />)
    expect(screen.getByText(/No services registered yet/i)).toBeInTheDocument()
  })
})
