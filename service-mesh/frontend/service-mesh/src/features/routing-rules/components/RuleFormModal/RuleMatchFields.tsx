interface RuleMatchFieldsProps {
  priority: number
  pathPrefix: string
  priorityError?: string
  onPriorityChange: (v: number) => void
  onPathPrefixChange: (v: string) => void
}

const fieldStyle = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontSize: '0.875rem',
} as const

export function RuleMatchFields({
  priority,
  pathPrefix,
  priorityError,
  onPriorityChange,
  onPathPrefixChange,
}: RuleMatchFieldsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', marginBottom: '1rem' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>
          Priority
        </label>
        <input
          type="number"
          value={priority}
          onChange={e => onPriorityChange(Number(e.target.value))}
          style={{ ...fieldStyle, border: `1px solid ${priorityError ? 'var(--color-error)' : 'var(--color-border)'}` }}
          aria-invalid={!!priorityError}
        />
        {priorityError && (
          <span style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
            {priorityError}
          </span>
        )}
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>
          Path prefix
        </label>
        <input
          type="text"
          value={pathPrefix}
          onChange={e => onPathPrefixChange(e.target.value)}
          placeholder="/api/v2"
          style={fieldStyle}
        />
      </div>
    </div>
  )
}
