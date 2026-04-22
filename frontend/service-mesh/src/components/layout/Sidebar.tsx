import { Link } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Server,
  GitBranch,
  Shield,
  History,
  Activity,
  ChevronLeft,
} from 'lucide-react'
import { useUIStore } from '@/store/ui'

const NAV = [
  { to: '/',           label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/services',   label: 'Services',   icon: Server },
  { to: '/routes',     label: 'Routes',     icon: GitBranch },
  { to: '/policies',   label: 'Policies',   icon: Shield },
  { to: '/revisions',  label: 'Revisions',  icon: History },
  { to: '/nodes',      label: 'Nodes',      icon: Activity },
] as const

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  return (
    <aside
      style={{
        width: sidebarCollapsed ? '56px' : 'var(--sidebar-width)',
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width var(--transition)',
        overflow: 'hidden',
        flexShrink: 0,
        height: '100dvh',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Logo */}
      <div style={{
        padding: 'var(--space-4)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        borderBottom: '1px solid var(--color-border)',
        minHeight: '56px',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-label="Service Mesh">
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
        {!sidebarCollapsed && (
          <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
            Service Mesh
          </span>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: 'var(--space-3) var(--space-2)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            style={{ textDecoration: 'none' }}
            activeProps={{ style: { textDecoration: 'none' } }}
          >
            {({ isActive }) => (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
                background: isActive ? 'var(--color-primary-dim)' : 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                fontWeight: isActive ? 500 : 400,
                fontSize: 'var(--text-sm)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}>
                <Icon size={16} strokeWidth={1.75} style={{ flexShrink: 0 }} />
                {!sidebarCollapsed && label}
              </div>
            )}
          </Link>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'flex-end',
          padding: 'var(--space-3) var(--space-4)',
          borderTop: '1px solid var(--color-border)',
          color: 'var(--color-text-faint)',
        }}
      >
        <ChevronLeft
          size={16}
          style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition)' }}
        />
      </button>
    </aside>
  )
}
