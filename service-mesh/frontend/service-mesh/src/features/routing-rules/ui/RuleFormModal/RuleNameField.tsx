import type { ReactElement } from 'react'
import type { AnyFieldApi } from '@tanstack/react-form'
import s from './RuleFormFields.module.css'

interface RuleNameFieldProps {
  field: AnyFieldApi
}

export function RuleNameField({ field }: RuleNameFieldProps): ReactElement {
  const error = field.state.meta.errors[0]
  return (
    <div className={s.field}>
      <label className={s.label} htmlFor={String(field.name)}>Rule name</label>
      <input
        id={String(field.name)}
        type="text"
        value={field.state.value as string}
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
