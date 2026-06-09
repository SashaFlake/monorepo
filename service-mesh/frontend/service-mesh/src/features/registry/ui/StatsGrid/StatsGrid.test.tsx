import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TooltipProvider } from '@/shared/ui'
import { StatsGrid } from './StatsGrid'
import type { RegistryStats } from '../../domain/registry.types'

const stats = (overrides: Partial<RegistryStats> = {}): RegistryStats => ({
  totalServices: 5,
  totalInstances: 12,
  passingInstances: 10,
  degradedInstances: 2,
  criticalInstances: 0,
  ...overrides,
})

const renderWithProvider = (ui: React.ReactElement): ReturnType<typeof render> =>
  render(<TooltipProvider>{ui}</TooltipProvider>)

describe('StatsGrid', () => {
  it('renders all stat labels', () => {
    renderWithProvider(<StatsGrid stats={stats()} isLoading={false} />)
    expect(screen.getByText('Services')).toBeInTheDocument()
    expect(screen.getByText('Instances')).toBeInTheDocument()
    expect(screen.getByText('Healthy')).toBeInTheDocument()
    expect(screen.getByText('Degraded')).toBeInTheDocument()
  })

  it('renders stat values', () => {
    renderWithProvider(<StatsGrid stats={stats()} isLoading={false} />)
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows dashes when loading', () => {
    renderWithProvider(<StatsGrid stats={stats()} isLoading={true} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBe(4)
  })

  it('shows critical label when criticalInstances > 0', () => {
    renderWithProvider(<StatsGrid stats={stats({ criticalInstances: 3, degradedInstances: 5 })} isLoading={false} />)
    expect(screen.getByText('3 critical')).toBeInTheDocument()
  })
})
