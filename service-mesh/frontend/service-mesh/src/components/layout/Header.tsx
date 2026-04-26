import { Bell, Search } from 'lucide-react'
import type { ReactNode } from 'react'

type HeaderProps = {
  title: string
  subtitle?: ReactNode
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 var(--space-6)',
      height: '56px',
      borderBottom: '1px solid var(--color-border)',
      background: 'var(--color-surface)',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-base)', fontWeight: 600, lineHeight: 1.2 }}>{title}</h1>
        {subtitle && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '1px' }}>{subtitle}</div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <button aria-label="Search" style={{ padding: 'var(--space-2)', color: 'var(--color-text-muted)', borderRadius: 'var(--radius-sm)' }}>
          <Search size={16} />
        </button>
        <button aria-label="Notifications" style={{ padding: 'var(--space-2)', color: 'var(--color-text-muted)', borderRadius: 'var(--radius-sm)' }}>
          <Bell size={16} />
        </button>
      </div>
    </header>
  )
}
