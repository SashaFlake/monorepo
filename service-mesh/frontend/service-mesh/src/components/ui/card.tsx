import {type ReactNode, type CSSProperties, ReactElement} from 'react'
import clsx from 'clsx'
import s from './Card.module.css'

type CardProps = {
  children: ReactNode
  style?: CSSProperties
  className?: string
}

export function Card({ children, style, className }: CardProps): ReactElement {
  return (
    <div className={clsx(s.card, className)} style={style}>
      {children}
    </div>
  )
}

export function CardHeader({ children }: { children: ReactNode }): ReactElement {
  return <div className={s.header}>{children}</div>
}

export function CardTitle({ children }: { children: ReactNode }): ReactElement {
  return <h3 className={s.title}>{children}</h3>
}

export function CardValue({ children, style }: { children: ReactNode; style?: CSSProperties }): ReactElement {
  return <p className={s.value} style={style}>{children}</p>
}
