import { Link } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Server,
  Shield,
  History,
  Activity,
  ChevronLeft,
} from 'lucide-react'
import { useUIStore } from '@/store/ui'
import s from './Sidebar.module.css'

const NAV = [
  { to: '/',          label: 'Dashboard', icon: LayoutDashboard },
  { to: '/services',  label: 'Services',  icon: Server },
  { to: '/policies',  label: 'Policies',  icon: Shield },
  { to: '/revisions', label: 'Revisions', icon: History },
  { to: '/nodes',     label: 'Nodes',     icon: Activity },
] as const

export function Sidebar(): JSX.Element {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  return (
    <aside className={s.sidebar} data-collapsed={sidebarCollapsed}>
      <div className={s.logo}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-label="Service Mesh" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="3" fill="var(--color-primary)" />
          <circle cx="4"  cy="5"  r="2" fill="var(--color-primary)" opacity="0.6" />
          <circle cx="20" cy="5"  r="2" fill="var(--color-primary)" opacity="0.6" />
          <circle cx="4"  cy="19" r="2" fill="var(--color-primary)" opacity="0.6" />
          <circle cx="20" cy="19" r="2" fill="var(--color-primary)" opacity="0.6" />
          <line x1="12" y1="12" x2="4"  y2="5"  stroke="var(--color-primary)" strokeWidth="1" opacity="0.4" />
          <line x1="12" y1="12" x2="20" y2="5"  stroke="var(--color-primary)" strokeWidth="1" opacity="0.4" />
          <line x1="12" y1="12" x2="4"  y2="19" stroke="var(--color-primary)" strokeWidth="1" opacity="0.4" />
          <line x1="12" y1="12" x2="20" y2="19" stroke="var(--color-primary)" strokeWidth="1" opacity="0.4" />
        </svg>
        {!sidebarCollapsed && <span className={s.logoLabel}>Service Mesh</span>}
      </div>

      <nav className={s.nav}>
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className={s.navLink}>
            {({ isActive }) => (
              <div className={s.navItem} data-active={isActive}>
                <Icon size={16} strokeWidth={1.75} style={{ flexShrink: 0 }} />
                {!sidebarCollapsed && label}
              </div>
            )}
          </Link>
        ))}
      </nav>

      <button
        onClick={toggleSidebar}
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={s.collapseBtn}
      >
        <ChevronLeft size={16} className={s.chevron} />
      </button>
    </aside>
  )
}
