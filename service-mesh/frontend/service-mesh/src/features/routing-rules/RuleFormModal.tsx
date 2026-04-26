// ---------------------------------------------------------------------------
// RuleFormModal — создание и редактирование routing rule
// ---------------------------------------------------------------------------

import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import type { RoutingRule, RuleFormValues, Upstream } from './types'
import { validateRule, getWeightSum, isWeightSumValid } from './validation'
import { Button } from '@/components/ui/button'
import { WeightBar } from './WeightBar'

interface RuleFormModalProps {
  initial?: RoutingRule           // если передан — режим редактирования
  isPending: boolean
  onSubmit: (values: RuleFormValues) => void
  onClose: () => void
}

const emptyUpstream = (): Upstream => ({ serviceId: '', weight: 0 })

const toFormValues = (rule: RoutingRule): RuleFormValues => ({
  name: rule.name,
  match: { host: rule.match.host ?? '', path: rule.match.path ?? '' },
  upstreams: rule.upstreams,
})

const defaultValues = (): RuleFormValues => ({
  name: '',
  match: { host: '', path: '' },
  upstreams: [emptyUpstream()],
})

export function RuleFormModal({ initial, isPending, onSubmit, onClose }: RuleFormModalProps) {
  const [values, setValues] = useState<RuleFormValues>(
    initial ? toFormValues(initial) : defaultValues()
  )
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const result = validateRule(values)
  const errors = result.valid ? [] : result.errors
  const fieldError = (field: string) =>
    submitAttempted ? errors.find(e => e.field === field)?.message : undefined

  const weightSum = getWeightSum(values.upstreams)
  const weightValid = isWeightSumValid(values.upstreams)

  // --- Handlers ---

  const setName = (name: string) => setValues(v => ({ ...v, name }))
  const setMatchField = (key: 'host' | 'path', val: string) =>
    setValues(v => ({ ...v, match: { ...v.match, [key]: val } }))

  const setUpstream = (index: number, patch: Partial<Upstream>) =>
    setValues(v => ({
      ...v,
      upstreams: v.upstreams.map((u, i) => i === index ? { ...u, ...patch } : u),
    }))

  const addUpstream = () =>
    setValues(v => ({ ...v, upstreams: [...v.upstreams, emptyUpstream()] }))

  const removeUpstream = (index: number) =>
    setValues(v => ({ ...v, upstreams: v.upstreams.filter((_, i) => i !== index) }))

  const handleSubmit = () => {
    setSubmitAttempted(true)
    if (result.valid) onSubmit(values)
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

        {/* Match */}
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Host</label>
            <input
              style={inputStyle()}
              value={values.match.host}
              onChange={e => setMatchField('host', e.target.value)}
              placeholder="api.example.com"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Path</label>
            <input
              style={inputStyle()}
              value={values.match.path}
              onChange={e => setMatchField('path', e.target.value)}
              placeholder="/api/v1/*"
            />
          </div>
        </div>

        {/* Upstreams */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
            <label style={{ ...labelStyle, margin: 0 }}>Upstreams *</label>
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
            {values.upstreams.map((u, i) => (
              <div key={i} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <input
                  style={{ ...inputStyle(!!fieldError(`upstreams.${i}.serviceId`)), flex: 1, fontFamily: 'monospace' }}
                  value={u.serviceId}
                  onChange={e => setUpstream(i, { serviceId: e.target.value })}
                  placeholder="service-id"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  style={{ ...inputStyle(), width: 72, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}
                  value={u.weight}
                  onChange={e => setUpstream(i, { weight: Number(e.target.value) })}
                />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>%</span>
                {values.upstreams.length > 1 && (
                  <button
                    onClick={() => removeUpstream(i)}
                    aria-label="Удалить upstream"
                    style={{ color: 'var(--color-text-faint)', padding: 'var(--space-1)', flexShrink: 0 }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* WeightBar preview */}
          {values.upstreams.some(u => u.serviceId && u.weight > 0) && (
            <div style={{ marginTop: 'var(--space-3)' }}>
              <WeightBar upstreams={values.upstreams.filter(u => u.serviceId)} />
            </div>
          )}

          {fieldError('upstreams') && <div style={errorStyle}>{fieldError('upstreams')}</div>}

          <button
            onClick={addUpstream}
            style={{
              marginTop: 'var(--space-2)',
              display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
              fontSize: 'var(--text-xs)', color: 'var(--color-primary)',
              padding: 'var(--space-1) 0',
            }}
          >
            <Plus size={12} /> Добавить upstream
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
