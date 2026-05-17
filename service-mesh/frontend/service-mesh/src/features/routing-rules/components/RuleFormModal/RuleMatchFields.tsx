import type { ReactElement } from 'react'
import type { AnyFieldApi } from '@tanstack/react-form'
import type { RuleFormValues } from '../../domain/types'
import s from './RuleFormFields.module.css'

interface RuleMatchFieldsProps {
  priorityField:   AnyFieldApi
  pathPrefixField: AnyFieldApi
}

export function RuleMatchFields({ priorityField, pathPrefixField }: RuleMatchFieldsProps): ReactElement {
  const priorityError = priorityField.state.meta.errors[0]
  const matchValue = pathPrefixField.state.value as RuleFormValues['match']

  return (
    <div className={s.matchGrid}>
      <div>
        <label className={s.label} htmlFor={String(priorityField.name)}>Priority</label>
        <input
          id={String(priorityField.name)}
          type="number"
          value={priorityField.state.value as number}
          onChange={e => priorityField.handleChange(Number(e.target.value))}
          onBlur={priorityField.handleBlur}
          className={s.input}
          aria-invalid={!!priorityError}
        />
        {priorityError && <span className={s.error}>{String(priorityError)}</span>}
      </div>

      <div>
        <label className={s.label} htmlFor="match.pathPrefix">Path prefix</label>
        <input
          id="match.pathPrefix"
          type="text"
          value={matchValue.pathPrefix ?? ''}
          onChange={e =>
            pathPrefixField.handleChange({ ...matchValue, pathPrefix: e.target.value })
          }
          onBlur={pathPrefixField.handleBlur}
          placeholder="/api/v2"
          className={s.input}
        />
      </div>
    </div>
  )
}
