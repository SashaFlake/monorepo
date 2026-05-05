import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WeightBar } from './WeightBar'
import type { DestinationDraft } from '../../model/types'

const dest = (version: string, weightPct: number): DestinationDraft => ({ version, weightPct })

describe('WeightBar', () => {
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
    render(<WeightBar destinations={[dest('', 100)]} />)
    expect(screen.getAllByText('default').length).toBeGreaterThanOrEqual(1)
  })
})
