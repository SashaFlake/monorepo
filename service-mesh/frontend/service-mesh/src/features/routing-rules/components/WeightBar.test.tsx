import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WeightBar } from './WeightBar'
import type { Destination } from '../model/types'

const dest = (version: string, weightPct: number): Destination => ({ version, weightPct })

describe('WeightBar', () => {
  it('ничего не рендерит для пустого массива', () => {
    const { container } = render(<WeightBar destinations={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('рендерит сегменты полосы для каждого destination', () => {
    render(<WeightBar destinations={[dest('v1', 80), dest('v2', 20)]} />)
    const segments = document.querySelectorAll('[title]')
    expect(segments).toHaveLength(2)
  })

  it('показывает версию и процент в tooltip', () => {
    render(<WeightBar destinations={[dest('v1', 80), dest('v2', 20)]} />)
    expect(document.querySelector('[title="v1: 80%"]')).toBeInTheDocument()
    expect(document.querySelector('[title="v2: 20%"]')).toBeInTheDocument()
  })

  it('показывает версии в легенде', () => {
    render(<WeightBar destinations={[dest('v1', 60), dest('v2', 40)]} />)
    expect(screen.getByText('v1')).toBeInTheDocument()
    expect(screen.getByText('v2')).toBeInTheDocument()
  })

  it('показывает проценты в легенде', () => {
    render(<WeightBar destinations={[dest('v1', 60), dest('v2', 40)]} />)
    expect(screen.getByText('60%')).toBeInTheDocument()
    expect(screen.getByText('40%')).toBeInTheDocument()
  })

  it('использует “default” если version не задан', () => {
    render(<WeightBar destinations={[{ weightPct: 100 }]} />)
    expect(screen.getAllByText('default').length).toBeGreaterThanOrEqual(1)
  })

  it('ширина сегмента соответствует weightPct', () => {
    render(<WeightBar destinations={[dest('v1', 80), dest('v2', 20)]} />)
    const firstSegment = document.querySelector('[title="v1: 80%"]') as HTMLElement
    expect(firstSegment.style.width).toBe('80%')
  })
})
