import type { ReactElement } from 'react'
import s from './RuleFormFields.module.css'

interface RuleNameFieldProps {
  value: string
  error?: string
  onChange: (value: string) => void
}

export function RuleNameField({ value, error, onChange }: RuleNameFieldProps): ReactElement {
  return (
    <div className={s.field}>
      <label className={s.label}>Rule name</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="e.g. canary-v2"
        className={s.input}
        aria-invalid={!!error}
        aria-describedby={error ? 'name-error' : undefined}
      />
      {error && <span id="name-error" className={s.error}>{error}</span>}
    </div>
  )
}
