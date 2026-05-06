import * as React from 'react'
import { Destination } from '../../model/types'
import { emptyDestinationDraft } from '../../model/types'
import { sumWeights } from '../../model/validation'
import { Button } from '@/components/ui/button'
import s from './DestinationList.module.css'

// ── Props ──────────────────────────────────────────────────────────────────────────

type DestinationListProps = {
  destinations: Destination[]
  onChange: (destinations: Destination[]) => void
}

type DestinationRowProps = {
  destination: Destination
  onUpdate: (id: string, version: string, weightPct: number) => void
  onRemove: (id: string) => void
}

// ── DestinationRow ──────────────────────────────────────────────────────────────────────

const DestinationRow = ({ destination, onUpdate, onRemove }: DestinationRowProps): React.ReactElement => (
  <div className={s.row}>
    <input
      className={s.input}
      placeholder="version"
      value={destination.version}
      onChange={(e): void => onUpdate(destination._brand, e.target.value, destination.weightPct)}
    />
    <input
      type="number"
      className={`${s.input} ${s.inputWeight}`}
      placeholder="%"
      value={destination.weightPct}
      onChange={(e): void => onUpdate(destination._brand, destination.version, Number(e.target.value))}
    />
    <button
      className={s.removeBtn}
      onClick={(): void => onRemove(destination._brand)}
      aria-label="Remove destination"
    >
      ✕
    </button>
  </div>
)

// ── DestinationList ──────────────────────────────────────────────────────────────────────

export const DestinationList = ({ destinations, onChange }: DestinationListProps): React.ReactElement => {
  const update = (id: string, version: string, weightPct: number): void =>
    onChange(
      destinations.map((d): Destination =>
        d._brand === id
          ? Destination.unsafe({ ...emptyDestinationDraft(), serviceId: d.serviceId, version, weightPct })
          : d
      )
    )

  const remove = (id: string): void =>
    onChange(destinations.filter((d): boolean => d._brand !== id))

  const add = (): void =>
    onChange([...destinations, Destination.unsafe({ ...emptyDestinationDraft(), version: '', weightPct: 0 })])

  const sum = sumWeights(destinations)
  const sumOk = sum === 100

  return (
    <div className={s.list}>
      {destinations.map((destination, index) => (
        <DestinationRow
          key={index}
          destination={destination}
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
