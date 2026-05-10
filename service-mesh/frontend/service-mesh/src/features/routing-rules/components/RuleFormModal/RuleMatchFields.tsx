import type { ReactElement } from 'react'
import type { FieldApi } from '@tanstack/react-form'
import type { RuleFormValues } from '../../model/types'
import s from './RuleFormFields.module.css'

interface RuleMatchFieldsProps {
  priorityField:   FieldApi<RuleFormValues, 'priority', undefined, undefined, number>
  pathPrefixField: FieldApi<RuleFormValues, 'match', undefined, undefined, RuleFormValues['match']>
}

export function RuleMatchFields({ priorityField, pathPrefixField }: RuleMatchFieldsProps): ReactElement {
  const priorityError = priorityField.state.meta.errors[0]

  return (
    <div className={s.matchGrid}>
      <div>
        <label className={s.label} htmlFor={priorityField.name}>Priority</label>
        <input
          id={priorityField.name}
          type="number"
          value={priorityField.state.value}
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
          value={pathPrefixField.state.value.pathPrefix ?? ''}
          onChange={e =>
            pathPrefixField.handleChange({
              ...pathPrefixField.state.value,
              pathPrefix: e.target.value,
            })
          }
          onBlur={pathPrefixField.handleBlur}
          placeholder="/api/v2"
          className={s.input}
        />
      </div>
    </div>
  )
}
