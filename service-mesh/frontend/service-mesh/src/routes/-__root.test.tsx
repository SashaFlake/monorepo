import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

// Mock dependencies BEFORE importing the route module
vi.mock('@tanstack/react-router', () => ({
  createRootRouteWithContext: () => ({ component }: { component: React.ComponentType }): { component: React.ComponentType } => ({ component }),
  Outlet: (): React.ReactElement => <div data-testid="outlet">Outlet</div>,
}))

vi.mock('@/components/layout/Sidebar', () => ({
  Sidebar: (): React.ReactElement => <div data-testid="sidebar">Sidebar</div>,
}))

vi.mock('sonner', () => ({
  Toaster: (): React.ReactElement => <div data-testid="toaster">Toaster</div>,
}))

vi.mock('@/shared/ui', () => ({
  TooltipProvider: ({ children }: { children: ReactNode }): React.ReactElement => <>{children}</>,
}))

// Import after mocks are established
const { Route } = await import('./__root')

describe('__root route', () => {
  it('renders sidebar, outlet and toaster', () => {
    const Component = (Route as unknown as { component: React.ComponentType }).component
    render(<Component />)
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('outlet')).toBeInTheDocument()
    expect(screen.getByTestId('toaster')).toBeInTheDocument()
  })
})
