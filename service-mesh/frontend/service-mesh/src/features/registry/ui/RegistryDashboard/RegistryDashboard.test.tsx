import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/render'
import { RegistryDashboard } from './RegistryDashboard'

vi.mock('../../application/useRegistryStats.application', () => ({
  useRegistryStats: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

import { useRegistryStats } from '../../application/useRegistryStats.application'

const mockedUseRegistryStats = vi.mocked(useRegistryStats)

describe('RegistryDashboard', () => {
  it('renders header and stats grid', () => {
    mockedUseRegistryStats.mockReturnValue({
      stats: { totalServices: 3, totalInstances: 9, passingInstances: 7, degradedInstances: 2, criticalInstances: 0 },
      services: [],
      isLoading: false,
      isError: false,
      updatedAt: '12:00:00',
    })

    render(<RegistryDashboard />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Updated 12:00:00')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows error card when isError is true', () => {
    mockedUseRegistryStats.mockReturnValue({
      stats: { totalServices: 0, totalInstances: 0, passingInstances: 0, degradedInstances: 0, criticalInstances: 0 },
      services: [],
      isLoading: false,
      isError: true,
      updatedAt: null,
    })

    render(<RegistryDashboard />)
    expect(screen.getByText(/Cannot reach registry/i)).toBeInTheDocument()
  })

  it('renders services table with data', () => {
    mockedUseRegistryStats.mockReturnValue({
      stats: { totalServices: 1, totalInstances: 2, passingInstances: 2, degradedInstances: 0, criticalInstances: 0 },
      services: [{ id: 'svc-1', name: 'auth', labels: {}, instances: [], worstStatus: 'passing', registeredAt: '' }],
      isLoading: false,
      isError: false,
      updatedAt: null,
    })

    render(<RegistryDashboard />)
    expect(screen.getByText('auth')).toBeInTheDocument()
  })
})
