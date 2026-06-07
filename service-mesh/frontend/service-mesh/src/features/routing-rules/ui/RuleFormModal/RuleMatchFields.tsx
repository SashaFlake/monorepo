import type { ReactElement } from 'react'
import type { AnyFieldApi } from '@tanstack/react-form'
import type { RuleFormValues } from '../../domain/types'
import s from './RuleFormFields.module.css'

/**
 * Props for {@link RuleMatchFields}.
 */
interface RuleMatchFieldsProps {
  /** TanStack Form field API for `priority`. */
  priorityField:   AnyFieldApi

  /** TanStack Form field API for `match`. */
  pathPrefixField: AnyFieldApi
}

/**
 * Form fields for rule priority and path-prefix matcher.
 *
 * Renders two inputs side by side and keeps the `match` object immutable
 * by spreading the existing value when the path prefix changes.
 *
 * @param priorityField   - Priority field API
 * @param pathPrefixField - Match/pathPrefix field API
 * @returns The match fields element
 * @sideEffects none
 */
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
