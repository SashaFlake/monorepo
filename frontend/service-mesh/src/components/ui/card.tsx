import { type ReactNode, type CSSProperties } from 'react'

type CardProps = {
  children: ReactNode
  style?: CSSProperties
  className?: string
}

export function Card({ children, style, className }: CardProps) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        boxShadow: 'var(--shadow-sm)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      marginBottom: 'var(--space-3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      ...style,
    }}>
      {children}
    </div>
  )
}

export function CardTitle({ children }: { children: ReactNode }) {
  return (
    <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {children}
    </h3>
  )
}

export function CardValue({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <p style={{ fontSize: 'var(--text-xl)', fontWeight: 700, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', ...style }}>
      {children}
    </p>
  )
}
