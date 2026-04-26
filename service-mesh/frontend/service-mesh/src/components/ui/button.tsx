import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const STYLES: Record<ButtonVariant, object> = {
  primary: {
    background: 'var(--color-primary)',
    color: '#0f1117',
    border: 'none',
    fontWeight: 600,
  },
  secondary: {
    background: 'var(--color-surface-offset)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-text-muted)',
    border: 'none',
  },
  danger: {
    background: 'rgba(248,81,73,0.12)',
    color: 'var(--color-error)',
    border: '1px solid rgba(248,81,73,0.2)',
  },
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  children: ReactNode
}

export function Button({ variant = 'secondary', children, style, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--text-sm)',
        cursor: 'pointer',
        transition: 'opacity var(--transition), background var(--transition)',
        ...STYLES[variant],
        ...style,
      }}
    >
      {children}
    </button>
  )
}
