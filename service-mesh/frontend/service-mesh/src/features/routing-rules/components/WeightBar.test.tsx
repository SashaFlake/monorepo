import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WeightBar } from './WeightBar'
import type { Destination } from '../model/types'

const dest = (version: string, weightPct: number): Destination => ({ version, weightPct })

describe('WeightBar — traffic distribution visualization', () => {
  it('shows nothing when there is no traffic split configured', () => {
    const { container } = render(<WeightBar destinations={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a separate visual segment for each destination', () => {
    // operator needs to see each version as a distinct slice
    render(<WeightBar destinations={[dest('v2', 10), dest('v1', 90)]} />)
    expect(document.querySelectorAll('[title]')).toHaveLength(2)
  })

  it('shows version label and its traffic share on hover', () => {
    // tooltip lets operator quickly inspect the split without reading the legend
    render(<WeightBar destinations={[dest('v2', 10), dest('v1', 90)]} />)
    expect(document.querySelector('[title="v2: 10%"]')).toBeInTheDocument()
    expect(document.querySelector('[title="v1: 90%"]')).toBeInTheDocument()
  })

  it('displays version labels in the legend so the operator can identify each slice', () => {
    render(<WeightBar destinations={[dest('v2', 10), dest('v1', 90)]} />)
    expect(screen.getByText('v2')).toBeInTheDocument()
    expect(screen.getByText('v1')).toBeInTheDocument()
  })

  it('displays traffic percentages next to each version in the legend', () => {
    render(<WeightBar destinations={[dest('v2', 10), dest('v1', 90)]} />)
    expect(screen.getByText('10%')).toBeInTheDocument()
    expect(screen.getByText('90%')).toBeInTheDocument()
  })

  it('labels an unnamed destination as "default"', () => {
    // destination without a version tag = default / catch-all route
    render(<WeightBar destinations={[{ weightPct: 100 }]} />)
    expect(screen.getAllByText('default').length).toBeGreaterThanOrEqual(1)
  })

  it('renders segment width proportional to traffic share', () => {
    // visual width must match the configured weight so the bar is not misleading
    render(<WeightBar destinations={[dest('v2', 10), dest('v1', 90)]} />)
    const segment = document.querySelector('[title="v2: 10%"]') as HTMLElement
    expect(segment.style.width).toBe('10%')
  })
})
