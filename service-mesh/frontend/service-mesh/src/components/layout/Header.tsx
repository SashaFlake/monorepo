import { Bell, Search } from 'lucide-react'
import type {ReactElement, ReactNode} from 'react'
import s from './Header.module.css'

/**
 * Props for {@link Header}.
 */
type HeaderProps = {
  /** Page title shown in the largest heading. */
  title: string

  /** Optional subtitle or breadcrumb rendered below the title. */
  subtitle?: ReactNode

  /** Optional action element rendered in the right-hand action area. */
  action?: ReactNode
}

/**
 * Top page header with title, optional subtitle, and standard actions.
 *
 * @param title    - Page title
 * @param subtitle - Optional subtitle content
 * @param action   - Optional action element
 * @returns The header element
 * @sideEffects none
 */
export function Header({ title, subtitle, action }: HeaderProps): ReactElement {
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
