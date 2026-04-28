interface RuleNameFieldProps {
  value: string
  error?: string
  onChange: (value: string) => void
}

export function RuleNameField({ value, error, onChange }: RuleNameFieldProps): JSX.Element {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>
        Rule name
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="e.g. canary-v2"
        style={{
          width: '100%',
          padding: '0.5rem 0.75rem',
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
          fontSize: '0.875rem',
        }}
        aria-invalid={!!error}
        aria-describedby={error ? 'name-error' : undefined}
      />
      {error && (
        <span id="name-error" style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
          {error}
        </span>
      )}
    </div>
  )
}
