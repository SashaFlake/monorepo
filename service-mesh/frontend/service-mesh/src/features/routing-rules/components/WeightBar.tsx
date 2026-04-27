import type { Destination } from '../types'

const COLORS = [
  'var(--color-primary)',
  'var(--color-blue)',
  'var(--color-success)',
  'var(--color-orange)',
  'var(--color-purple)',
]

interface WeightBarProps {
  destinations: Destination[]
}

export function WeightBar({ destinations }: WeightBarProps) {
  if (destinations.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <div style={{
        display: 'flex',
        height: 6,
        borderRadius: 'var(--radius-full)',
        overflow: 'hidden',
        background: 'var(--color-surface-offset)',
      }}>
        {destinations.map((d, i) => (
          <div
            key={d.version ?? i}
            title={`${d.version ?? 'default'}: ${d.weightPct}%`}
            style={{
              width: `${d.weightPct}%`,
              background: COLORS[i % COLORS.length],
              transition: 'width 200ms ease',
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        {destinations.map((d, i) => (
          <div
            key={d.version ?? i}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}
          >
            <span style={{
              width: 8, height: 8,
              borderRadius: 2,
              background: COLORS[i % COLORS.length],
              flexShrink: 0,
            }} />
            <span style={{ fontFamily: 'monospace' }}>{d.version ?? 'default'}</span>
            <span style={{ color: 'var(--color-text-faint)' }}>{d.weightPct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
