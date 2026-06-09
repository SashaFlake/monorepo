import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorCard } from './ErrorCard'

describe('ErrorCard', () => {
  it('renders title and message', () => {
    render(<ErrorCard message="Something went wrong" />)
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('uses custom title when provided', () => {
    render(<ErrorCard title="Custom Title" message="Oops" />)
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
  })

  it('renders retry button when onRetry is provided', () => {
    const onRetry = vi.fn()
    render(<ErrorCard message="Fail" onRetry={onRetry} />)
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn()
    render(<ErrorCard message="Fail" onRetry={onRetry} />)
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('renders children', () => {
    render(<ErrorCard message="Fail"><div data-testid="child">Extra</div></ErrorCard>)
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})
