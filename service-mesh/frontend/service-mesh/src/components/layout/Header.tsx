import { Bell, Search } from 'lucide-react'
import type { ReactNode } from 'react'
import s from './Header.module.css'

type HeaderProps = {
  title: string
  subtitle?: ReactNode
  action?: ReactNode
}

export function Header({ title, subtitle, action }: HeaderProps) {
  return (
    <header className={s.header}>
      <div className={s.titleBlock}>
        <h1 className={s.title}>{title}</h1>
        {subtitle && <div className={s.subtitle}>{subtitle}</div>}
      </div>
      <div className={s.actions}>
        {action}
        <button aria-label="Search" className={s.iconBtn}>
          <Search size={16} />
        </button>
        <button aria-label="Notifications" className={s.iconBtn}>
          <Bell size={16} />
        </button>
      </div>
    </header>
  )
}
