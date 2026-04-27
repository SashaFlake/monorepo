// ---------------------------------------------------------------------------
// RuleFormModal — создание и редактирование routing rule
// ---------------------------------------------------------------------------

import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import type { RoutingRule, RuleFormValues, Destination } from './types'
import { validateRule, sumWeights } from './validation'
import { Button } from '@/components/ui/button'
import { WeightBar } from './WeightBar'

interface RuleFormModalProps {
  initial?: RoutingRule           // если передан — режим редактирования
  isPending: boolean
  onSubmit: (values: RuleFormValues) => void
  onClose: () => void
}

const emptyDestination = (): Destination => ({ version: '', weightPct: 0 })

const toFormValues = (rule: RoutingRule): RuleFormValues => ({
  name: rule.name,
  priority: rule.priority,
  match: rule.match,
  destinations: rule.destinations,
})

const defaultValues = (): RuleFormValues => ({
  name: '',
  priority: 100,
  match: {},
  destinations: [emptyDestination()],
})

export function RuleFormModal({ initial, isPending, onSubmit, onClose }: RuleFormModalProps) {
  const [values, setValues] = useState<RuleFormValues>(
    initial ? toFormValues(initial) : defaultValues()
  )
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const result = validateRule(values)
  const errors = result.ok ? [] : result.errors
  const fieldError = (field: string) =>
    submitAttempted ? errors.find(e => e.field === field)?.message : undefined

  const weightSum = sumWeights(values.destinations)
  const weightValid = weightSum === 100

  // --- Handlers ---

  const setName = (name: string) => setValues(v => ({ ...v, name }))
  const setPriority = (priority: number) => setValues(v => ({ ...v, priority }))
  const setMatchField = (key: 'pathPrefix', val: string) =>
    setValues(v => ({ ...v, match: { ...v.match, [key]: val } }))

  const setDestination = (index: number, patch: Partial<Destination>) =>
    setValues(v => ({
      ...v,
      destinations: v.destinations.map((d, i) => i === index ? { ...d, ...patch } : d),
    }))

  const addDestination = () =>
    setValues(v => ({ ...v, destinations: [...v.destinations, emptyDestination()] }))

  const removeDestination = (index: number) =>
    setValues(v => ({ ...v, destinations: v.destinations.filter((_, i) => i !== index) }))

  const handleSubmit = () => {
    setSubmitAttempted(true)
    if (result.ok) onSubmit(values)
  }

  // --- Styles ---

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: '100%',
    padding: 'var(--space-2) var(--space-3)',
    fontSize: 'var(--text-sm)',
    background: 'var(--color-surface-offset)',
    border: `1px solid ${hasError ? 'var(--color-error)' : 'var(--color-border)'}`,
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text)',
    outline: 'none',
    fontFamily: 'inherit',
  })

  const labelStyle: React.CSSProperties = {
    fontSize: 'var(--text-xs)',
    fontWeight: 500,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 'var(--space-1)',
    display: 'block',
  }

  const errorStyle: React.CSSProperties = {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-error)',
    marginTop: 'var(--space-1)',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'oklch(from var(--color-bg) l c h / 0.7)',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-6)',
        width: '100%',
        maxWidth: 560,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-5)',
      }}>

        {/* Заголовок */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: 0 }}>
            {initial ? 'Редактировать правило' : 'Новое правило'}
          </h2>
          <button onClick={onClose} aria-label="Закрыть" style={{ color: 'var(--color-text-muted)', padding: 'var(--space-1)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Название */}
        <div>
          <label style={labelStyle}>Название *</label>
          <input
            style={inputStyle(!!fieldError('name'))}
            value={values.name}
            onChange={e => setName(e.target.value)}
            placeholder="api-gateway-split"
            autoFocus
          />
          {fieldError('name') && <div style={errorStyle}>{fieldError('name')}</div>}
        </div>

        {/* Приоритет + Match */}
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <div style={{ width: 100 }}>
            <label style={labelStyle}>Приоритет</label>
            <input
              type="number"
              min={0}
              max={1000}
              style={inputStyle(!!fieldError('priority'))}
              value={values.priority}
              onChange={e => setPriority(Number(e.target.value))}
            />
            {fieldError('priority') && <div style={errorStyle}>{fieldError('priority')}</div>}
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Path prefix</label>
            <input
              style={inputStyle()}
              value={values.match.pathPrefix ?? ''}
              onChange={e => setMatchField('pathPrefix', e.target.value)}
              placeholder="/api/v1/*"
            />
          </div>
        </div>

        {/* Destinations */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
            <label style={{ ...labelStyle, margin: 0 }}>Destinations *</label>
            <span style={{
              fontSize: 'var(--text-xs)',
              fontVariantNumeric: 'tabular-nums',
              color: weightValid ? 'var(--color-success)' : weightSum > 100 ? 'var(--color-error)' : 'var(--color-text-muted)',
              fontWeight: 500,
            }}>
              {weightSum}/100%
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {values.destinations.map((d, i) => (
              <div key={i} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <input
                  style={{ ...inputStyle(), flex: 1, fontFamily: 'monospace' }}
                  value={d.version ?? ''}
                  onChange={e => setDestination(i, { version: e.target.value })}
                  placeholder="v1.2.0"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  style={{ ...inputStyle(), width: 72, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}
                  value={d.weightPct}
                  onChange={e => setDestination(i, { weightPct: Number(e.target.value) })}
                />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>%</span>
                {values.destinations.length > 1 && (
                  <button
                    onClick={() => removeDestination(i)}
                    aria-label="Удалить destination"
                    style={{ color: 'var(--color-text-faint)', padding: 'var(--space-1)', flexShrink: 0 }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* WeightBar preview */}
          {values.destinations.some(d => d.version && d.weightPct > 0) && (
            <div style={{ marginTop: 'var(--space-3)' }}>
              <WeightBar destinations={values.destinations.filter(d => d.version)} />
            </div>
          )}

          {fieldError('destinations') && <div style={errorStyle}>{fieldError('destinations')}</div>}

          <button
            onClick={addDestination}
            style={{
              marginTop: 'var(--space-2)',
              display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
              fontSize: 'var(--text-xs)', color: 'var(--color-primary)',
              padding: 'var(--space-1) 0',
            }}
          >
            <Plus size={12} /> Добавить destination
          </button>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--color-divider)' }}>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>Отмена</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Сохранение…' : initial ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      </div>
    </div>
  )
}
