import type { ReactNode } from 'react'
import s from './Badge.module.css'

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'

type BadgeProps = {
  variant?: BadgeVariant
  children: ReactNode
}

export function Badge({ variant = 'neutral', children }: BadgeProps): JSX.Element {
  return (
    <span className={s.badge} data-variant={variant}>
      <span className={s.dot} />
      {children}
    </span>
  )
}
