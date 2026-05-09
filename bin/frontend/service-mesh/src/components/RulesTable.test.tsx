import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RulesTable } from './RulesTable'
import type { RoutingRule } from '../types/routing'

const mockRules: RoutingRule[] = [
  { id: '1', version: 'v1.0', weightPct: 80, status: 'active' },
  { id: '2', version: 'v1.1', weightPct: 20, status: 'inactive' },
]

describe('RulesTable', () => {
  it('renders empty state when no rules', () => {
    render(<RulesTable rules={[]} onDelete={vi.fn()} />)
    expect(screen.getByText('Нет правил маршрутизации')).toBeInTheDocument()
  })

  it('renders rules in table', () => {
    render(<RulesTable rules={mockRules} onDelete={vi.fn()} />)
    expect(screen.getByText('v1.0')).toBeInTheDocument()
    expect(screen.getByText('v1.1')).toBeInTheDocument()
  })

  it('shows delete dialog on button click', async () => {
    const user = userEvent.setup()
    render(<RulesTable rules={mockRules} onDelete={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /удалить правило v1.0/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Удалить правило?')).toBeInTheDocument()
  })

  it('calls onDelete with correct id on confirm', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<RulesTable rules={mockRules} onDelete={onDelete} />)

    await user.click(screen.getByRole('button', { name: /удалить правило v1.0/i }))
    await user.click(screen.getByRole('button', { name: /^удалить$/i }))

    expect(onDelete).toHaveBeenCalledWith('1')
  })

  it('closes dialog on cancel', async () => {
    const user = userEvent.setup()
    render(<RulesTable rules={mockRules} onDelete={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /удалить правило v1.0/i }))
    await user.click(screen.getByRole('button', { name: /отмена/i }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
