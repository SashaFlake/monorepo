import type { Destination } from '../model/types'
import { sumWeights } from '../model/validation'
import { Button } from '@/components/ui/button'
import s from './DestinationList.module.css'

type Props = {
  destinations: Destination[]
  onChange: (destinations: Destination[]) => void
}

export const DestinationList = ({ destinations, onChange }: Props) => {
  const update = (index: number, patch: Partial<Destination>) =>
    onChange(destinations.map((d, i) => i === index ? { ...d, ...patch } : d))

  const remove = (i: number) =>
    onChange(destinations.filter((_, index) => index !== i))

  const add = () =>
    onChange([...destinations, { version: '', weightPct: 0 }])

  const sum = sumWeights(destinations)
  const sumOk = sum === 100

  return (
    <div className={s.list}>
      {destinations.map((item, i) => (
        <div key={i} className={s.row}>
          <input
            className={s.input}
            placeholder="version"
            value={item.version ?? ''}
            onChange={e => update(i, { version: e.target.value })}
          />
          <input
            type="number"
            className={`${s.input} ${s.inputWeight}`}
            placeholder="%"
            value={item.weightPct}
            onChange={e => update(i, { weightPct: Number(e.target.value) })}
          />
          <button className={s.removeBtn} onClick={() => remove(i)} aria-label="Remove destination">
            ✕
          </button>
        </div>
      ))}
      <div className={s.footer}>
        <Button variant="ghost" onClick={add}>+ Add destination</Button>
        <span className={`${s.sum} ${sumOk ? s.sumOk : s.sumError}`}>
          {sumOk ? `${sum}% ✓` : `${sum}% — должно быть 100%`}
        </span>
      </div>
    </div>
  )
}
