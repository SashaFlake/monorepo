import type { ReactElement } from 'react'
import s from './RuleFormFields.module.css'

interface RuleMatchFieldsProps {
  priority: number
  pathPrefix: string
  priorityError?: string
  onPriorityChange: (v: number) => void
  onPathPrefixChange: (v: string) => void
}

export function RuleMatchFields({
  priority,
  pathPrefix,
  priorityError,
  onPriorityChange,
  onPathPrefixChange,
}: RuleMatchFieldsProps): ReactElement {
  return (
    <div className={s.matchGrid}>
      <div>
        <label className={s.label}>Priority</label>
        <input
          type="number"
          value={priority}
          onChange={e => onPriorityChange(Number(e.target.value))}
          className={s.input}
          aria-invalid={!!priorityError}
        />
        {priorityError && <span className={s.error}>{priorityError}</span>}
      </div>

      <div>
        <label className={s.label}>Path prefix</label>
        <input
          type="text"
          value={pathPrefix}
          onChange={e => onPathPrefixChange(e.target.value)}
          placeholder="/api/v2"
          className={s.input}
        />
      </div>
    </div>
  )
}
