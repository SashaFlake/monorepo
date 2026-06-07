import type {ReactElement, ReactNode} from 'react'
import s from './Badge.module.css'

/**
 * Visual variant of the {@link Badge} primitive.
 */
type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'

/**
 * Props for {@link Badge}.
 */
type BadgeProps = {
  /** Visual style variant. */
  variant?: BadgeVariant

  /** Badge text. */
  children: ReactNode
}

/**
 * Small status badge with a coloured dot and text.
 *
 * Used to display instance statuses, labels, and other compact state
 * indicators.
 *
 * @param variant  - Visual variant (defaults to `neutral`)
 * @param children - Badge text
 * @returns The badge element
 * @sideEffects none
 */
export function Badge({ variant = 'neutral', children }: BadgeProps): ReactElement {
  return (
    <span className={s.badge} data-variant={variant}>
      <span className={s.dot} />
      {children}
    </span>
  )
}
