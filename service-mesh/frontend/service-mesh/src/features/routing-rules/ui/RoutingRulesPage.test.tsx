import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@/test/render'
import { RoutingRulesPage } from './RoutingRulesPage'
import type { RoutingRule } from '@/features/routing-rules'

const makeRule = (overrides = {}): RoutingRule => ({
  id: 'r1',
  serviceId: 'svc-1',
  name: 'rule-a',
  priority: 100,
  match: {},
  destinations: [],
  createdAt: '',
  updatedAt: '',
  ...overrides,
})

vi.mock('@/features/routing-rules', () => ({
  useRoutingRules: vi.fn(),
}))

import { useRoutingRules } from '@/features/routing-rules'

const mockedUseRoutingRules = vi.mocked(useRoutingRules)

describe('RoutingRulesPage', () => {
  it('renders loading state', () => {
    mockedUseRoutingRules.mockReturnValue({
      rules: [], isLoading: true, isError: false,
      createOpen: false, editRule: null, deleteRule: null,
      openCreate: vi.fn(), closeCreate: vi.fn(),
      openEdit: vi.fn(), closeEdit: vi.fn(),
      openDelete: vi.fn(), closeDelete: vi.fn(),
      create: vi.fn(), update: vi.fn(), remove: vi.fn(),
      isCreating: false, isUpdating: false, isDeleting: false,
    })

    render(<RoutingRulesPage serviceId="svc-1" />)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('renders error state', () => {
    mockedUseRoutingRules.mockReturnValue({
      rules: [], isLoading: false, isError: true,
      createOpen: false, editRule: null, deleteRule: null,
      openCreate: vi.fn(), closeCreate: vi.fn(),
      openEdit: vi.fn(), closeEdit: vi.fn(),
      openDelete: vi.fn(), closeDelete: vi.fn(),
      create: vi.fn(), update: vi.fn(), remove: vi.fn(),
      isCreating: false, isUpdating: false, isDeleting: false,
    })

    render(<RoutingRulesPage serviceId="svc-1" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load routing rules')
  })

  it('renders rules table and new rule button', () => {
    mockedUseRoutingRules.mockReturnValue({
      rules: [makeRule()], isLoading: false, isError: false,
      createOpen: false, editRule: null, deleteRule: null,
      openCreate: vi.fn(), closeCreate: vi.fn(),
      openEdit: vi.fn(), closeEdit: vi.fn(),
      openDelete: vi.fn(), closeDelete: vi.fn(),
      create: vi.fn(), update: vi.fn(), remove: vi.fn(),
      isCreating: false, isUpdating: false, isDeleting: false,
    })

    render(<RoutingRulesPage serviceId="svc-1" />)
    expect(screen.getByRole('button', { name: 'New rule' })).toBeInTheDocument()
    expect(screen.getByText('rule-a')).toBeInTheDocument()
  })

  it('opens create modal on button click', () => {
    const openCreate = vi.fn()
    mockedUseRoutingRules.mockReturnValue({
      rules: [], isLoading: false, isError: false,
      createOpen: false, editRule: null, deleteRule: null,
      openCreate, closeCreate: vi.fn(),
      openEdit: vi.fn(), closeEdit: vi.fn(),
      openDelete: vi.fn(), closeDelete: vi.fn(),
      create: vi.fn(), update: vi.fn(), remove: vi.fn(),
      isCreating: false, isUpdating: false, isDeleting: false,
    })

    render(<RoutingRulesPage serviceId="svc-1" />)
    fireEvent.click(screen.getByRole('button', { name: 'New rule' }))
    expect(openCreate).toHaveBeenCalledTimes(1)
  })

  it('renders edit modal when editRule is set', () => {
    mockedUseRoutingRules.mockReturnValue({
      rules: [], isLoading: false, isError: false,
      createOpen: false, editRule: makeRule(), deleteRule: null,
      openCreate: vi.fn(), closeCreate: vi.fn(),
      openEdit: vi.fn(), closeEdit: vi.fn(),
      openDelete: vi.fn(), closeDelete: vi.fn(),
      create: vi.fn(), update: vi.fn(), remove: vi.fn(),
      isCreating: false, isUpdating: false, isDeleting: false,
    })

    render(<RoutingRulesPage serviceId="svc-1" />)
    expect(screen.getByText('Edit rule')).toBeInTheDocument()
  })

  it('renders delete dialog when deleteRule is set', () => {
    mockedUseRoutingRules.mockReturnValue({
      rules: [], isLoading: false, isError: false,
      createOpen: false, editRule: null, deleteRule: makeRule(),
      openCreate: vi.fn(), closeCreate: vi.fn(),
      openEdit: vi.fn(), closeEdit: vi.fn(),
      openDelete: vi.fn(), closeDelete: vi.fn(),
      create: vi.fn(), update: vi.fn(), remove: vi.fn(),
      isCreating: false, isUpdating: false, isDeleting: false,
    })

    render(<RoutingRulesPage serviceId="svc-1" />)
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })
})
