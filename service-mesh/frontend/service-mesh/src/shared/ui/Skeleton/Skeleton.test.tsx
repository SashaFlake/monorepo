import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Skeleton } from './Skeleton'

describe('Skeleton', () => {
  it('renders with default props', () => {
    const { container } = render(<Skeleton />)
    expect((container.firstChild as HTMLElement).className).toContain('skeleton')
  })

  it('applies custom width and height via CSS variables', () => {
    const { container } = render(<Skeleton width="100px" height="20px" />)
    const el = container.firstChild as HTMLElement
    expect(el.style.getPropertyValue('--skeleton-width')).toBe('100px')
    expect(el.style.getPropertyValue('--skeleton-height')).toBe('20px')
  })
})
