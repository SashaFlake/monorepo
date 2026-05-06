import type { ReactElement } from 'react'
import { Array as A, pipe } from 'effect'
import type { DestinationDraft } from '../../model/types'
import { emptyDestinationDraft } from '../../model/types'
import { sumWeights } from '../../model/validation'
import { Button } from '@/components/ui/button'
import { WeightBar } from '../WeightBar/WeightBar'
import s from './DestinationList.module.css'

type Props = {
  destinations: DestinationDraft[]
  onChange: (destinations: DestinationDraft[]) => void
}

export function DestinationList({ destinations, onChange }: Props): ReactElement {
  const update = (id: string, version: string, weightPct: number): void =>
    onChange(
      destinations.map((d): DestinationDraft =>
        d.id === id ? { ...d, version, weightPct } : d
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
            onChange={(e): void => update(item.id, e.target.value, item.weightPct)}
          />
          <input
            type="number"
            className={`${s.input} ${s.inputWeight}`}
            placeholder="%"
            value={item.weightPct}
            onChange={(e): void => update(item.id, item.version, Number(e.target.value))}
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
