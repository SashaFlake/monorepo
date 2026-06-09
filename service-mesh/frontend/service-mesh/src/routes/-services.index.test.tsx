import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Route } from './services.index'

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => ({ component }: { component: React.ComponentType }): { component: React.ComponentType } => {
    const Comp = component
    return { component: Comp }
  },
}))

vi.mock('@/features/services', () => ({
  ServicesPage: (): React.ReactElement => <div data-testid="services-page">ServicesPage</div>,
}))

describe('services.index route', () => {
  it('renders ServicesPage component', () => {
    const Component = (Route as unknown as { component: React.ComponentType }).component
    render(<Component />)
    expect(screen.getByTestId('services-page')).toBeInTheDocument()
  })
})
