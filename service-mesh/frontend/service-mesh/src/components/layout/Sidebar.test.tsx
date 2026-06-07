import { describe, it, expect, vi } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { Sidebar } from './Sidebar'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: (props: { isActive: boolean }) => ReactNode; to: string }) => (
    <a href={to}>{children({ isActive: false })}</a>
  ),
}))

vi.mock('@/store/ui', () => ({
  useUIStore: () => ({ sidebarCollapsed: false, toggleSidebar: vi.fn() }),
}))

describe('Sidebar', () => {
  it('renders navigation links', () => {
    render(<Sidebar />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Services')).toBeInTheDocument()
  })

  it('renders logo', () => {
    render(<Sidebar />)
    expect(screen.getByText('Service Mesh')).toBeInTheDocument()
  })
})
