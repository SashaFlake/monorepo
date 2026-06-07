import {type ReactNode, type CSSProperties, ReactElement} from 'react'
import clsx from 'clsx'
import s from './Card.module.css'

/**
 * Props for {@link Card}.
 */
type CardProps = {
  /** Card body content. */
  children: ReactNode

  /** Optional inline styles. */
  style?: CSSProperties

  /** Additional CSS class names. */
  className?: string
}

/**
 * Generic card container with a subtle border and background.
 *
 * @param children  - Body content
 * @param style     - Optional inline styles
 * @param className - Optional extra classes
 * @returns The card element
 * @sideEffects none
 */
export function Card({ children, style, className }: CardProps): ReactElement {
  return (
    <div className={clsx(s.card, className)} style={style}>
      {children}
    </div>
  )
}

/**
 * Header row inside a {@link Card}, usually containing a title and an icon.
 *
 * @param children - Header content
 * @returns The card header element
 * @sideEffects none
 */
export function CardHeader({ children }: { children: ReactNode }): ReactElement {
  return <div className={s.header}>{children}</div>
}

/**
 * Title element inside a {@link CardHeader}.
 *
 * @param children - Title text
 * @returns The card title element
 * @sideEffects none
 */
export function CardTitle({ children }: { children: ReactNode }): ReactElement {
  return <h3 className={s.title}>{children}</h3>
}

/**
 * Large numeric or emphasised value displayed inside a {@link Card}.
 *
 * @param children - Value content
 * @param style    - Optional inline styles
 * @returns The card value element
 * @sideEffects none
 */
export function CardValue({ children, style }: { children: ReactNode; style?: CSSProperties }): ReactElement {
  return <p className={s.value} style={style}>{children}</p>
}
