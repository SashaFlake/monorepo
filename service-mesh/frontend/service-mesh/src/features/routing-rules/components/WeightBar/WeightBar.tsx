import type { ReactElement } from 'react'
import type { Destination } from '../../model/types'
import styles from './WeightBar.module.css'

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

export function WeightBar({ destinations }: WeightBarProps): ReactElement | null {
  if (destinations.length === 0) return null

  return (
    <div className={styles.root}>
      <div className={styles.track}>
        {destinations.map((item, i) => (
          <div
            key={item.version ?? i}
            className={styles.segment}
            title={`${item.version ?? 'default'}: ${item.weightPct}%`}
            style={{ width: `${item.weightPct}%`, background: COLORS[i % COLORS.length] }}
          />
        ))}
      </div>
      <div className={styles.legend}>
        {destinations.map((item, i) => (
          <div key={item.version ?? i} className={styles.legendItem}>
            <span
              className={styles.legendDot}
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className={styles.legendVersion}>{item.version ?? 'default'}</span>
            <span className={styles.legendWeight}>{item.weightPct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
