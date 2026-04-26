// ---------------------------------------------------------------------------
// WeightBar — визуализация distribution весов upstream-сервисов
// ---------------------------------------------------------------------------

import type { Upstream } from './types'

const COLORS = [
  'var(--color-primary)',
  'var(--color-blue)',
  'var(--color-success)',
  'var(--color-orange)',
  'var(--color-purple)',
]

interface WeightBarProps {
  upstreams: Upstream[]
}

export function WeightBar({ upstreams }: WeightBarProps) {
  if (upstreams.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {/* Полоса */}
      <div style={{
        display: 'flex',
        height: 6,
        borderRadius: 'var(--radius-full)',
        overflow: 'hidden',
        background: 'var(--color-surface-offset)',
      }}>
        {upstreams.map((u, i) => (
          <div
            key={u.serviceId || i}
            title={`${u.serviceId}: ${u.weight}%`}
            style={{
              width: `${u.weight}%`,
              background: COLORS[i % COLORS.length],
              transition: 'width 200ms ease',
            }}
          />
        ))}
      </div>

      {/* Легенда */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        {upstreams.map((u, i) => (
          <div
            key={u.serviceId || i}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}
          >
            <span style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: COLORS[i % COLORS.length],
              flexShrink: 0,
            }} />
            <span style={{ fontFamily: 'monospace' }}>{u.serviceId || '—'}</span>
            <span style={{ color: 'var(--color-text-faint)' }}>{u.weight}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
