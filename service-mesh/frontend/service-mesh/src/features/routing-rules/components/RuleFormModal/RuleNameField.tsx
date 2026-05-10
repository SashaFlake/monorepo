import type { ReactElement } from 'react'
import type { FieldApi } from '@tanstack/react-form'
import type { RuleFormValues } from '../../model/types'
import s from './RuleFormFields.module.css'

interface RuleNameFieldProps {
  field: FieldApi<RuleFormValues, 'name', undefined, undefined, string>
}

export function RuleNameField({ field }: RuleNameFieldProps): ReactElement {
  const error = field.state.meta.errors[0]
  return (
    <div className={s.field}>
      <label className={s.label} htmlFor={field.name}>Rule name</label>
      <input
        id={field.name}
        type="text"
        value={field.state.value}
        onChange={e => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        placeholder="e.g. canary-v2"
        className={s.input}
        aria-invalid={!!error}
        aria-describedby={error ? 'name-error' : undefined}
      />
      {error && <span id="name-error" className={s.error}>{String(error)}</span>}
    </div>
  )
}
