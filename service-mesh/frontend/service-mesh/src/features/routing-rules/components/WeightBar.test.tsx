import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WeightBar } from './WeightBar'
import type { Destination } from '../model/types'

const dest = (version: string, weightPct: number): Destination => ({ version, weightPct })

describe('WeightBar', () => {
  it('renders nothing for an empty destinations array', () => {
    const { container } = render(<WeightBar destinations={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders one bar segment per destination', () => {
    render(<WeightBar destinations={[dest('v1', 80), dest('v2', 20)]} />)
    expect(document.querySelectorAll('[title]')).toHaveLength(2)
  })

  it('shows version and percentage in segment tooltip', () => {
    render(<WeightBar destinations={[dest('v1', 80), dest('v2', 20)]} />)
    expect(document.querySelector('[title="v1: 80%"]')).toBeInTheDocument()
    expect(document.querySelector('[title="v2: 20%"]')).toBeInTheDocument()
  })

  it('shows versions in the legend', () => {
    render(<WeightBar destinations={[dest('v1', 60), dest('v2', 40)]} />)
    expect(screen.getByText('v1')).toBeInTheDocument()
    expect(screen.getByText('v2')).toBeInTheDocument()
  })

  it('shows percentages in the legend', () => {
    render(<WeightBar destinations={[dest('v1', 60), dest('v2', 40)]} />)
    expect(screen.getByText('60%')).toBeInTheDocument()
    expect(screen.getByText('40%')).toBeInTheDocument()
  })

  it('falls back to "default" label when version is not set', () => {
    render(<WeightBar destinations={[{ weightPct: 100 }]} />)
    expect(screen.getAllByText('default').length).toBeGreaterThanOrEqual(1)
  })

  it('sets segment width equal to weightPct', () => {
    render(<WeightBar destinations={[dest('v1', 80), dest('v2', 20)]} />)
    const segment = document.querySelector('[title="v1: 80%"]') as HTMLElement
    expect(segment.style.width).toBe('80%')
  })
})
