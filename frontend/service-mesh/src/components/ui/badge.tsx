import type { ReactNode } from 'react'

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'

const VARIANTS: Record<BadgeVariant, { color: string; background: string }> = {
  success: { color: 'var(--color-success)', background: 'rgba(63,185,80,0.12)' },
  warning: { color: 'var(--color-warning)', background: 'rgba(210,153,34,0.12)' },
  error:   { color: 'var(--color-error)',   background: 'rgba(248,81,73,0.12)' },
  info:    { color: 'var(--color-info)',     background: 'rgba(88,166,255,0.12)' },
  neutral: { color: 'var(--color-text-muted)', background: 'var(--color-surface-offset)' },
}

type BadgeProps = {
  variant?: BadgeVariant
  children: ReactNode
}

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  const { color, background } = VARIANTS[variant]
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 8px',
      borderRadius: 'var(--radius-sm)',
      fontSize: 'var(--text-xs)',
      fontWeight: 500,
      color,
      background,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {children}
    </span>
  )
}
