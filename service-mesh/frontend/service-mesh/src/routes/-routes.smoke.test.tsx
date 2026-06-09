import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

// Provide minimal mocks for TanStack Router and layout components
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (): ((opts: { component: React.ComponentType }) => unknown) =>
    ({ component }) => {
      const Route = { component, useParams: vi.fn() }
      return Route
    },
  Outlet: (): React.ReactElement => <div data-testid="outlet">Outlet</div>,
}))

vi.mock('@/features/registry', () => ({
  RegistryDashboard: (): React.ReactElement => <div data-testid="registry-dashboard">Dashboard</div>,
}))

vi.mock('@/features/services', () => ({
  ServiceDetailPage: ({ serviceId }: { serviceId: string }): React.ReactElement => <div data-testid="service-detail">{serviceId}</div>,
  ServicesPage: (): React.ReactElement => <div data-testid="services-page">Services</div>,
}))

vi.mock('@/features/routing-rules', () => ({
  RoutingRulesPage: ({ serviceId }: { serviceId: string }): React.ReactElement => <div data-testid="routing-rules">{serviceId}</div>,
}))

vi.mock('@/components/layout/Header', () => ({
  Header: ({ title }: { title: string }): React.ReactElement => <header>{title}</header>,
}))

vi.mock('@/shared/ui', () => ({
  Card: ({ children }: { children: ReactNode }): React.ReactElement => <div>{children}</div>,
}))

describe('route smoke tests', () => {
  it('index route renders dashboard', async () => {
    const { Route } = await import('./index')
    const Comp = Route.component as React.ComponentType
    render(<Comp />)
    expect(screen.getByTestId('registry-dashboard')).toBeInTheDocument()
  })

  it('services layout renders outlet', async () => {
    const { Route } = await import('./services')
    const Comp = Route.component as React.ComponentType
    render(<Comp />)
    expect(screen.getByTestId('outlet')).toBeInTheDocument()
  })

  it('services.index route renders services page', async () => {
    const { Route } = await import('./services.index')
    const Comp = Route.component as React.ComponentType
    render(<Comp />)
    expect(screen.getByTestId('services-page')).toBeInTheDocument()
  })

  it('services.$serviceId route renders service detail', async () => {
    const { Route } = await import('./services.$serviceId')
    const Comp = Route.component as React.ComponentType
    // The route reads params from Route.useParams(); mock it
    vi.spyOn(Route, 'useParams').mockReturnValue({ serviceId: 'svc-1' })
    render(<Comp />)
    expect(screen.getByTestId('service-detail')).toHaveTextContent('svc-1')
  })

  it('services.$serviceId.routing-rules route renders routing rules', async () => {
    const { Route } = await import('./services.$serviceId.routing-rules')
    const Comp = Route.component as React.ComponentType
    vi.spyOn(Route, 'useParams').mockReturnValue({ serviceId: 'svc-1' })
    render(<Comp />)
    expect(screen.getByTestId('routing-rules')).toHaveTextContent('svc-1')
  })

  it('nodes route renders placeholder', async () => {
    const { Route } = await import('./nodes')
    const Comp = Route.component as React.ComponentType
    render(<Comp />)
    expect(screen.getByText('Nodes — coming soon')).toBeInTheDocument()
  })

  it('policies route renders placeholder', async () => {
    const { Route } = await import('./policies')
    const Comp = Route.component as React.ComponentType
    render(<Comp />)
    expect(screen.getByText('Policies — coming soon')).toBeInTheDocument()
  })

  it('revisions route renders placeholder', async () => {
    const { Route } = await import('./revisions')
    const Comp = Route.component as React.ComponentType
    render(<Comp />)
    expect(screen.getByText('Revisions — coming soon')).toBeInTheDocument()
  })
})
