import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ServiceDetailPage } from './ServiceDetailPage'

vi.mock('../../application/useServiceDetail.application', () => ({
  useServiceDetail: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }): React.ReactElement => <a href={to}>{children}</a>,
}))

vi.mock('@/features/routing-rules', () => ({
  RoutingRulesPage: ({ serviceId }: { serviceId: string }): React.ReactElement => <div data-testid="routing-rules">Rules for {serviceId}</div>,
}))

vi.mock('./VersionCard', () => ({
  VersionCard: ({ version }: { version: { version: string } }): React.ReactElement => <div data-testid="version-card">{version.version}</div>,
}))

import { useServiceDetail } from '../../application/useServiceDetail.application'

const mockedUseServiceDetail = vi.mocked(useServiceDetail)

describe('ServiceDetailPage', () => {
  it('renders loading state', () => {
    mockedUseServiceDetail.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null } as ReturnType<typeof useServiceDetail>)
    render(<ServiceDetailPage serviceId="svc-1" />)
    expect(screen.getByText(/Loading/i)).toBeInTheDocument()
    expect(screen.getAllByText('svc-1').length).toBeGreaterThanOrEqual(1)
  })

  it('renders error state', () => {
    mockedUseServiceDetail.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error('fail') } as ReturnType<typeof useServiceDetail>)
    render(<ServiceDetailPage serviceId="svc-1" />)
    expect(screen.getByText(/Could not load service/i)).toBeInTheDocument()
  })

  it('renders empty state when no versions', () => {
    mockedUseServiceDetail.mockReturnValue({
      data: { serviceId: 'svc-1', serviceName: 'auth', versions: [] },
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useServiceDetail>)
    render(<ServiceDetailPage serviceId="svc-1" />)
    expect(screen.getByText(/No instances registered/i)).toBeInTheDocument()
  })

  it('renders version cards', () => {
    mockedUseServiceDetail.mockReturnValue({
      data: {
        serviceId: 'svc-1',
        serviceName: 'auth',
        versions: [
          { version: 'v1', instanceCount: 2, instances: [], manifest: {} as never },
          { version: 'v2', instanceCount: 1, instances: [], manifest: {} as never },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useServiceDetail>)
    render(<ServiceDetailPage serviceId="svc-1" />)
    expect(screen.getAllByTestId('version-card').length).toBe(2)
    expect(screen.getAllByText('auth').length).toBeGreaterThanOrEqual(1)
  })

  it('renders routing rules tab', () => {
    mockedUseServiceDetail.mockReturnValue({
      data: { serviceId: 'svc-1', serviceName: 'auth', versions: [] },
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useServiceDetail>)
    render(<ServiceDetailPage serviceId="svc-1" />)
    expect(screen.getByRole('tab', { name: 'Routing Rules' })).toBeInTheDocument()
  })
})
