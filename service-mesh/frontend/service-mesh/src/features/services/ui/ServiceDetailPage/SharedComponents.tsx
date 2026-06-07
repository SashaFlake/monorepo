import { ReactElement } from 'react'
import type { ReactNode } from 'react'
import s from './ServiceDetailPage.module.css'

/**
 * Props for {@link SpecCard}.
 */
interface SpecCardProps {
  /** Card heading. */
  title: string

  /** Body content, usually a list of {@link KV} rows. */
  children: ReactNode
}

/**
 * Small card for a single section of the manifest specification grid.
 *
 * @param title    - Card heading
 * @param children - Body content
 * @returns The spec card element
 * @sideEffects none
 */
export function SpecCard({ title, children }: SpecCardProps): ReactElement {
  return (
    <div className={s.specCard}>
      <div className={s.specCardTitle}>{title}</div>
      <div className={s.specCardBody}>{children}</div>
    </div>
  )
}

/**
 * Props for {@link KV}.
 */
interface KVProps {
  /** Key label. */
  k: string

  /** Value text. */
  v: string
}

/**
 * Single key/value row used inside {@link SpecCard}.
 *
 * @param k - Key label
 * @param v - Value text
 * @returns The key/value element
 * @sideEffects none
 */
export function KV({ k, v }: KVProps): ReactElement {
  return (
    <div className={s.kv}>
      <span className={s.kvKey}>{k}</span>
      <span className={s.kvValue}>{v}</span>
    </div>
  )
}
