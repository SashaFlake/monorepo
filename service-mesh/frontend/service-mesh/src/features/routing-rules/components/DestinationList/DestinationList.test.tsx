import { describe, it, expect, vi } from 'vitest'
import type { ReactElement } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { DestinationList } from './DestinationList'
import type { DestinationDraft } from '../../model/types'

vi.mock('../WeightBar/WeightBar', () => ({
  WeightBar: (): ReactElement => <div data-testid="weight-bar" />,
}))

const make = (version: string, weightPct: number): DestinationDraft => ({
  serviceId: undefined,
  version,
  weightPct,
})

describe('DestinationList', () => {
  describe('empty state', () => {
    it('renders add button and sum = 0 when destinations is empty', () => {
      render(<DestinationList destinations={[]} onChange={vi.fn()} />)

      expect(screen.getByText('+ Add destination')).toBeInTheDocument()
      expect(screen.getByText(/0%/)).toBeInTheDocument()
      expect(screen.queryByTestId('weight-bar')).not.toBeInTheDocument()
    })
  })

  describe('adding a destination', () => {
    it('calls onChange with a new empty draft appended', () => {
      const onChange = vi.fn()
      render(<DestinationList destinations={[]} onChange={onChange} />)

      fireEvent.click(screen.getByText('+ Add destination'))

      expect(onChange).toHaveBeenCalledOnce()
      const next = onChange.mock.calls[0][0] as DestinationDraft[]
      expect(next).toHaveLength(1)
      expect(next[0]?.version).toBe('')
      expect(next[0]?.weightPct).toBe(0)
    })
  })

  describe('removing a destination', () => {
    it('calls onChange without the removed item', () => {
      const onChange = vi.fn()
      const items = [make('v1', 60), make('v2', 40)]
      render(<DestinationList destinations={items} onChange={onChange} />)

      fireEvent.click(screen.getAllByLabelText('Remove destination')[0])

      const next = onChange.mock.calls[0][0] as DestinationDraft[]
      expect(next).toHaveLength(1)
      expect(next[0]?.version).toBe('v2')
    })
  })

  describe('updating a destination', () => {
    it('calls onChange with updated version on version input change', () => {
      const onChange = vi.fn()
      render(<DestinationList destinations={[make('v1', 100)]} onChange={onChange} />)

      fireEvent.change(screen.getByPlaceholderText('version'), {
        target: { value: 'v2' },
      })

      const next = onChange.mock.calls[0][0] as DestinationDraft[]
      expect(next[0]?.version).toBe('v2')
      expect(next[0]?.weightPct).toBe(100)
    })

    it('calls onChange with updated weightPct on weight input change', () => {
      const onChange = vi.fn()
      render(<DestinationList destinations={[make('v1', 50)]} onChange={onChange} />)

      fireEvent.change(screen.getByPlaceholderText('%'), {
        target: { value: '80' },
      })

      const next = onChange.mock.calls[0][0] as DestinationDraft[]
      expect(next[0]?.weightPct).toBe(80)
    })
  })

  describe('weight sum indicator', () => {
    it('shows ✓ when sum equals 100', () => {
      render(
        <DestinationList
          destinations={[make('v1', 60), make('v2', 40)]}
          onChange={vi.fn()}
        />
      )
      expect(screen.getByText('100% ✓')).toBeInTheDocument()
    })

    it('shows error message when sum is not 100', () => {
      render(
        <DestinationList
          destinations={[make('v1', 60), make('v2', 20)]}
          onChange={vi.fn()}
        />
      )
      expect(screen.getByText(/must equal 100%/)).toBeInTheDocument()
    })
  })

  describe('WeightBar', () => {
    it('renders WeightBar when destinations is non-empty', () => {
      render(
        <DestinationList
          destinations={[make('v1', 100)]}
          onChange={vi.fn()}
        />
      )
      expect(screen.getByTestId('weight-bar')).toBeInTheDocument()
    })

    it('does not render WeightBar when destinations is empty', () => {
      render(<DestinationList destinations={[]} onChange={vi.fn()} />)
      expect(screen.queryByTestId('weight-bar')).not.toBeInTheDocument()
    })
  })
})
