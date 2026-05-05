import * as React from 'react'
import { Destination } from '../../model/types'
import { sumWeights } from '../../model/validation'
import { Button } from '@/components/ui/button'
import s from './DestinationList.module.css'

// ── Props ───────────────────────────────────────────────────────────────────

type DestinationListProps = {
  destinations: Destination[]
  onChange: (destinations: Destination[]) => void
}

type DestinationRowProps = {
  destination: Destination
  index: number
  onUpdate: (index: number, version: string, weightPct: number) => void
  onRemove: (index: number) => void
}

// ── DestinationRow ───────────────────────────────────────────────────────────

const DestinationRow = ({ destination, index, onUpdate, onRemove }: DestinationRowProps): React.ReactElement => (
  <div className={s.row}>
    <input
      className={s.input}
      placeholder="version"
      value={destination.version}
      onChange={(e): void => onUpdate(index, e.target.value, destination.weightPct)}
    />
    <input
      type="number"
      className={`${s.input} ${s.inputWeight}`}
      placeholder="%"
      value={destination.weightPct}
      onChange={(e): void => onUpdate(index, destination.version, Number(e.target.value))}
    />
    <button
      className={s.removeBtn}
      onClick={(): void => onRemove(index)}
      aria-label="Remove destination"
    >
      ✕
    </button>
  </div>
)

// ── DestinationList ───────────────────────────────────────────────────────────

export const DestinationList = ({ destinations, onChange }: DestinationListProps): React.ReactElement => {
  const update = (index: number, version: string, weightPct: number): void =>
    onChange(
      destinations.map((d, idx): Destination =>
        idx === index
          ? Destination.unsafe({ serviceId: d.serviceId, version, weightPct })
          : d
      )
    )

  const remove = (index: number): void =>
    onChange(destinations.filter((_d, idx): boolean => idx !== index))

  const add = (): void =>
    onChange([...destinations, Destination.unsafe({ version: '', weightPct: 0 })])

  const sum = sumWeights(destinations)
  const sumOk = sum === 100

  return (
    <div className={s.list}>
      {destinations.map((destination, index) => (
        <DestinationRow
          key={index}
          destination={destination}
          index={index}
          onUpdate={update}
          onRemove={remove}
        />
      ))}
      <div className={s.footer}>
        <Button variant="ghost" onClick={add}>+ Add destination</Button>
        <span className={`${s.sum} ${sumOk ? s.sumOk : s.sumError}`}>
          {sumOk ? `${sum}% ✓` : `${sum}% — must equal 100%`}
        </span>
      </div>
    </div>
  )
}
