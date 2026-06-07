import type { ReactElement } from 'react'
import { Array as A, pipe } from 'effect'
import type { DestinationDraft } from '../../domain/types'
import { emptyDestinationDraft } from '../../domain/types'
import { sumWeights } from '../../domain/types'
import { Button } from '@/shared/ui'
import { WeightBar } from '../WeightBar/WeightBar'
import s from './DestinationList.module.css'

/**
 * Props for {@link DestinationList}.
 */
type Props = {
  /** Current destination drafts in the form. */
  destinations: DestinationDraft[]

  /** Called with the updated array whenever the user edits, adds, or removes a row. */
  onChange: (destinations: DestinationDraft[]) => void
}

/**
 * Editable list of routing destinations with a live weight-sum indicator
 * and a visual weight bar.
 *
 * @param destinations - Current destination drafts
 * @param onChange     - Change handler
 * @returns The destination list element
 * @sideEffects Calls `emptyDestinationDraft()` (and therefore `crypto.randomUUID()`)
 *              when the user clicks "Add destination".
 */
export function DestinationList({ destinations, onChange }: Props): ReactElement {
  const update = (id: string, patch: Partial<Pick<DestinationDraft, 'version' | 'weightPct'>>): void =>
    onChange(
        destinations.map((d): DestinationDraft =>
            d.id === id ? { ...d, ...patch } : d
        )
    )

  const remove = (id: string): void =>
    onChange(destinations.filter((d): boolean => d.id !== id))

  const add = (): void =>
    onChange([...destinations, emptyDestinationDraft()])

  const sum = sumWeights(destinations)
  const sumOk = sum === 100

  const weightBar = pipe(
    destinations,
    A.match({
      onEmpty: () => null,
      onNonEmpty: (nea) => <WeightBar destinations={nea} />,
    })
  )

  return (
    <div className={s.list}>
      {destinations.map((item) => (
        <div key={item.id} className={s.row}>
          <input
            className={s.input}
            placeholder="version"
            value={item.version}
            onChange={(e) => update(item.id, { version: e.target.value  })}
          />
          <input
            type="number"
            className={`${s.input} ${s.inputWeight}`}
            placeholder="%"
            value={item.weightPct}
            onChange={(e): void => update(item.id, { weightPct: Number(e.target.value)})}
          />
          <button
            className={s.removeBtn}
            onClick={(): void => remove(item.id)}
            aria-label="Remove destination"
          >
            ✕
          </button>
        </div>
      ))}
      <div className={s.footer}>
        <Button variant="ghost" onClick={add}>+ Add destination</Button>
        <span className={`${s.sum} ${sumOk ? s.sumOk : s.sumError}`}>
          {sumOk ? `${sum}% ✓` : `${sum}% — must equal 100%`}
        </span>
      </div>
      {weightBar}
    </div>
  )
}
