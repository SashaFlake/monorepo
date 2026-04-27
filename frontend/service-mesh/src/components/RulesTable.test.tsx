import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RulesTable } from './RulesTable'
import type { RoutingRule } from '../types/routing'

const rule = (id: string, version: string, weightPct: number, status: RoutingRule['status'] = 'active'): RoutingRule =>
  ({ id, version, weightPct, status })

const rules = [
  rule('1', 'v1', 80, 'active'),
  rule('2', 'v2-canary', 20, 'inactive'),
]

describe('RulesTable', () => {
  it('renders each rule version', () => {
    render(<RulesTable rules={rules} onDelete={vi.fn()} />)
    expect(screen.getByText('v1')).toBeInTheDocument()
    expect(screen.getByText('v2-canary')).toBeInTheDocument()
  })

  it('shows empty state when there are no rules', () => {
    render(<RulesTable rules={[]} onDelete={vi.fn()} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/нет правил/i)).toBeInTheDocument()
  })

  it('opens confirmation dialog on delete button click', () => {
    render(<RulesTable rules={rules} onDelete={vi.fn()} />)
    fireEvent.click(screen.getByLabelText('Удалить правило v1'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/v1/)).toBeInTheDocument()
  })

  it('calls onDelete with correct id on confirm', () => {
    const onDelete = vi.fn()
    render(<RulesTable rules={rules} onDelete={onDelete} />)
    fireEvent.click(screen.getByLabelText('Удалить правило v1'))
    fireEvent.click(screen.getByText('Удалить'))
    expect(onDelete).toHaveBeenCalledWith('1')
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('closes dialog without deleting on cancel', () => {
    const onDelete = vi.fn()
    render(<RulesTable rules={rules} onDelete={onDelete} />)
    fireEvent.click(screen.getByLabelText('Удалить правило v1'))
    fireEvent.click(screen.getByText('Отмена'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('disables buttons when isPending is true', () => {
    render(<RulesTable rules={rules} onDelete={vi.fn()} isPending />)
    fireEvent.click(screen.getByLabelText('Удалить правило v1'))
    expect(screen.getByText('Удаление…')).toBeDisabled()
    expect(screen.getByText('Отмена')).toBeDisabled()
  })
})
