import type { ReactElement } from 'react'
import { Array as A } from 'effect'
import type { DestinationDraft } from '../../domain/types'
import { Tooltip } from '@/shared/ui'
import styles from './WeightBar.module.css'

const COLORS = [
  'var(--color-primary)',
  'var(--color-blue)',
  'var(--color-success)',
  'var(--color-orange)',
  'var(--color-purple)',
]

interface WeightBarProps {
  destinations: Readonly<A.NonEmptyArray<DestinationDraft>>
}

export function WeightBar({ destinations }: WeightBarProps): ReactElement {
  return (
    <div className={styles.root}>
      <div className={styles.track}>
        {destinations.map((item, i) => (
          <Tooltip
            key={item.version || i}
            content={`${item.version || 'default'}: ${item.weightPct}%`}
            side="top"
          >
            <div
              className={styles.segment}
              style={{ width: `${item.weightPct}%`, background: COLORS[i % COLORS.length] }}
            />
          </Tooltip>
        ))}
      </div>
      <div className={styles.legend}>
        {destinations.map((item, i) => (
          <div key={item.version || i} className={styles.legendItem}>
            <span
              className={styles.legendDot}
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className={styles.legendVersion}>{item.version || 'default'}</span>
            <span className={styles.legendWeight}>{item.weightPct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
