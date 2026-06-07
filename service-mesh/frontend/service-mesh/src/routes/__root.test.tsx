import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

// Mock dependencies BEFORE importing the route module
vi.mock('@tanstack/react-router', () => ({
  createRootRouteWithContext: () => ({ component }: { component: React.ComponentType }) => ({ component }),
  Outlet: () => <div data-testid="outlet">Outlet</div>,
}))

vi.mock('@/components/layout/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}))

vi.mock('sonner', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}))

vi.mock('@/shared/ui', () => ({
  TooltipProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

// Import after mocks are established
const { Route } = await import('./__root')

describe('__root route', () => {
  it('renders sidebar, outlet and toaster', () => {
    const Component = Route.component
    render(<Component />)
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('outlet')).toBeInTheDocument()
    expect(screen.getByTestId('toaster')).toBeInTheDocument()
  })
})
