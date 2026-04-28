import type { ReactElement } from 'react'
import { Array as A, pipe } from 'effect'
import type { Destination } from '../../model/types'
import { sumWeights } from '../../model/validation'
import { Button } from '@/components/ui/button'
import { WeightBar } from '../WeightBar/WeightBar'
import s from './DestinationList.module.css'

type Props = {
  destinations: Destination[]
  onChange: (destinations: Destination[]) => void
}

export function DestinationList({ destinations, onChange }: Props): ReactElement {
  const update = (index: number, patch: Partial<Destination>): void =>
    onChange(destinations.map((d, idx) => idx === index ? { ...d, ...patch } : d))

  const remove = (index: number): void =>
    onChange(destinations.filter((_, idx) => idx !== index))

  const add = (): void =>
    onChange([...destinations, { version: '', weightPct: 0 }])

  const sum = sumWeights(destinations)
  const sumOk = sum === 100

  const bar = pipe(
    destinations,
    A.match({
      onEmpty: () => null,
      onNonEmpty: (nea) => <WeightBar destinations={nea} />
    })
  )

  return (
    <div className={s.list}>
      {destinations.map((item, index) => (
        <div key={index} className={s.row}>
          <input
            className={s.input}
            placeholder="version"
            value={item.version ?? ''}
            onChange={e => update(index, { version: e.target.value })}
          />
          <input
            type="number"
            className={`${s.input} ${s.inputWeight}`}
            placeholder="%"
            value={item.weightPct}
            onChange={e => update(index, { weightPct: Number(e.target.value) })}
          />
          <button className={s.removeBtn} onClick={() => remove(index)} aria-label="Remove destination">
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
      {bar}
    </div>
  )
}
