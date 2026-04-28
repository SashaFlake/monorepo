import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RulesTable } from './RulesTable'
import type { RoutingRule } from '../../model/types'

const rule = (overrides: Partial<RoutingRule> = {}): RoutingRule => ({
  id: '1',
  serviceId: 'svc-1',
  name: 'test-rule',
  priority: 100,
  match: { pathPrefix: '/api' },
  destinations: [{ version: 'v1', weightPct: 100 }],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('RulesTable', () => {
  it('renders rule names', () => {
    const rules = [rule({ id: '1', name: 'rule-a' }), rule({ id: '2', name: 'rule-b' })]
    render(<RulesTable rules={rules} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('rule-a')).toBeInTheDocument()
    expect(screen.getByText('rule-b')).toBeInTheDocument()
  })

  it('shows empty state when there are no rules', () => {
    render(<RulesTable rules={[]} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/no routing rules/i)).toBeInTheDocument()
  })

  it('opens confirmation dialog on delete button click', () => {
    const rules = [rule({ name: 'my-rule' })]
    render(<RulesTable rules={rules} onEdit={vi.fn()} onDelete={vi.fn()} />)
    fireEvent.click(screen.getByLabelText('Delete rule my-rule'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/my-rule/)).toBeInTheDocument()
  })

  it('calls onDelete with correct id on confirm', () => {
    const onDelete = vi.fn()
    const rules = [rule({ id: 'abc', name: 'my-rule' })]
    render(<RulesTable rules={rules} onEdit={vi.fn()} onDelete={onDelete} />)
    fireEvent.click(screen.getByLabelText('delete rule my-rule', { exact: false }))
    fireEvent.click(screen.getByText('Delete'))
    expect(onDelete).toHaveBeenCalledWith('abc')
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('closes dialog without deleting on cancel', () => {
    const onDelete = vi.fn()
    const rules = [rule({ name: 'my-rule' })]
    render(<RulesTable rules={rules} onEdit={vi.fn()} onDelete={onDelete} />)
    fireEvent.click(screen.getByLabelText('delete rule my-rule', { exact: false }))
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('disables buttons when isPending is true', () => {
    const rules = [rule({ name: 'my-rule' })]
    render(<RulesTable rules={rules} onEdit={vi.fn()} onDelete={vi.fn()} isPending />)
    fireEvent.click(screen.getByLabelText('delete rule my-rule', { exact: false }))
    expect(screen.getByText('Deleting…')).toBeDisabled()
    expect(screen.getByText('Cancel')).toBeDisabled()
  })

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn()
    const r = rule({ name: 'my-rule' })
    render(<RulesTable rules={[r]} onEdit={onEdit} onDelete={vi.fn()} />)
    fireEvent.click(screen.getByLabelText('edit rule my-rule', { exact: false }))
    expect(onEdit).toHaveBeenCalledWith(r)
  })
})
