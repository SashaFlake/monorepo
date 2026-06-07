import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Header } from './Header'

describe('Header', () => {
  it('renders title', () => {
    render(<Header title="Dashboard" />)
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(<Header title="Dashboard" subtitle="Overview" />)
    expect(screen.getByText('Overview')).toBeInTheDocument()
  })

  it('renders action slot', () => {
    render(<Header title="Dashboard" action={<button>Action</button>} />)
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
  })

  it('renders search and notification buttons', () => {
    render(<Header title="Dashboard" />)
    expect(screen.getByLabelText('Search')).toBeInTheDocument()
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument()
  })
})
