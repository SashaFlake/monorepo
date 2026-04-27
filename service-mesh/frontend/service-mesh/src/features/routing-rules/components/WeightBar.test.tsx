import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WeightBar } from './WeightBar'
import type { Destination } from '../model/types'

const dest = (version: string, weightPct: number): Destination => ({ version, weightPct })

describe('WeightBar', () => {
  it('renders nothing when no traffic split is configured', () => {
    const { container } = render(<WeightBar destinations={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a separate visual segment for each destination', () => {
    render(<WeightBar destinations={[dest('v2', 10), dest('v1', 90)]} />)
    expect(document.querySelectorAll('[title]')).toHaveLength(2)
  })

  it('shows version and traffic share on segment hover', () => {
    render(<WeightBar destinations={[dest('v2', 10), dest('v1', 90)]} />)
    expect(document.querySelector('[title="v2: 10%"]')).toBeInTheDocument()
    expect(document.querySelector('[title="v1: 90%"]')).toBeInTheDocument()
  })

  it('lists each version in the legend', () => {
    render(<WeightBar destinations={[dest('v2', 10), dest('v1', 90)]} />)
    expect(screen.getByText('v2')).toBeInTheDocument()
    expect(screen.getByText('v1')).toBeInTheDocument()
  })

  it('shows traffic percentage next to each version in the legend', () => {
    render(<WeightBar destinations={[dest('v2', 10), dest('v1', 90)]} />)
    expect(screen.getByText('10%')).toBeInTheDocument()
    expect(screen.getByText('90%')).toBeInTheDocument()
  })

  it('labels an unversioned destination as "default"', () => {
    render(<WeightBar destinations={[{ weightPct: 100 }]} />)
    expect(screen.getAllByText('default').length).toBeGreaterThanOrEqual(1)
  })

  it('segment width reflects the configured traffic percentage', () => {
    render(<WeightBar destinations={[dest('v2', 10), dest('v1', 90)]} />)
    const segment = document.querySelector('[title="v2: 10%"]') as HTMLElement
    expect(segment.style.width).toBe('10%')
  })
})
