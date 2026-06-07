import { ReactElement } from 'react'
import type { ReactNode } from 'react'
import s from './ServiceDetailPage.module.css'

export function SpecCard({ title, children }: { title: string; children: ReactNode }): ReactElement {
  return (
    <div className={s.specCard}>
      <div className={s.specCardTitle}>{title}</div>
      <div className={s.specCardBody}>{children}</div>
    </div>
  )
}

export function KV({ k, v }: { k: string; v: string }): ReactElement {
  return (
    <div className={s.kv}>
      <span className={s.kvKey}>{k}</span>
      <span className={s.kvValue}>{v}</span>
    </div>
  )
}
