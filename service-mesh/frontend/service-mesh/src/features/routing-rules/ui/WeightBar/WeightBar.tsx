import type { ReactElement } from 'react'
import { Array as A } from 'effect'
import type { DestinationDraft } from '../../domain/types'
import { Tooltip } from '@/shared/ui'
import styles from './WeightBar.module.css'

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
              data-color-index={i % 5}
              style={{ '--segment-width': `${item.weightPct}%` } as React.CSSProperties}
            />
          </Tooltip>
        ))}
      </div>
      <div className={styles.legend}>
        {destinations.map((item, i) => (
          <div key={item.version || i} className={styles.legendItem}>
            <span
              className={styles.legendDot}
              data-color-index={i % 5}
            />
            <span className={styles.legendVersion}>{item.version || 'default'}</span>
            <span className={styles.legendWeight}>{item.weightPct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
