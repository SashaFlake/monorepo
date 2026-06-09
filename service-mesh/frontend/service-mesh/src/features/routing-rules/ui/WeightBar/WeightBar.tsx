import type { ReactElement } from 'react'
import { Array as A } from 'effect'
import type { DestinationDraft } from '../../domain/routing-rules.types'
import { Tooltip } from '@/shared/ui'
import styles from './WeightBar.module.css'

/**
 * Props for {@link WeightBar}.
 */
interface WeightBarProps {
  /** Non-empty list of destination drafts with weights. */
  destinations: Readonly<A.NonEmptyArray<DestinationDraft>>
}

/**
 * Visual weight distribution bar with colored segments and legend.
 *
 * @param props – see {@link WeightBarProps}
 * @returns WeightBar React element
 * @sideEffects none
 */
export function WeightBar({ destinations }: WeightBarProps): ReactElement {
  return (
    <div className={styles.root}>
      <div className={styles.track}>
        {destinations.map((item, i) => (
          <Tooltip
            key={item.id}
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
          <div key={item.id} className={styles.legendItem}>
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
