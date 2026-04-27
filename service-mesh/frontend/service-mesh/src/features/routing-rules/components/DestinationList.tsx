import type { Destination } from '../model/types'
import { sumWeights } from '../model/validation'

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

  return (
    <div>
      {destinations.map((d, i) => (
        <div key={i}>
          <input
            value={d.version ?? ''}
            onChange={e => update(i, { version: e.target.value })}
          />
          <input
            type="number"
            value={d.weightPct}
            onChange={e => update(i, { weightPct: Number(e.target.value) })}
          />
          <button onClick={() => remove(i)}>x</button>
        </div>
      ))}
      <button onClick={add}>add</button>
      <span>{sum === 100 ? `${sum}% ✓` : `${sum}% — должно быть 100%`}</span>
    </div>
  )
}
