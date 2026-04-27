import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import type { RoutingRule, RuleFormValues, Destination } from '../model/types'
import { validateRule, sumWeights } from '../model/validation'
import { Button } from '@/components/ui/button'
import { WeightBar } from './WeightBar'
import styles from './RuleFormModal.module.css'

interface RuleFormModalProps {
  initial?: RoutingRule
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

  const weightSum   = sumWeights(values.destinations)
  const weightValid = weightSum === 100

  const setName       = (name: string)     => setValues(v => ({ ...v, name }))
  const setPriority   = (priority: number) => setValues(v => ({ ...v, priority }))
  const setMatchField = (key: 'pathPrefix', val: string) =>
    setValues(v => ({ ...v, match: { ...v.match, [key]: val } }))

  const setDestination = (index: number, patch: Partial<Destination>) =>
    setValues(v => ({
      ...v,
      destinations: v.destinations.map((d, i) => i === index ? { ...d, ...patch } : d),
    }))

  const addDestination    = () =>
    setValues(v => ({ ...v, destinations: [...v.destinations, emptyDestination()] }))

  const removeDestination = (index: number) =>
    setValues(v => ({ ...v, destinations: v.destinations.filter((_, i) => i !== index) }))

  const handleSubmit = () => {
    setSubmitAttempted(true)
    if (result.ok) onSubmit(values)
  }

  const weightSumClass = weightValid
    ? `${styles.weightSum} ${styles['weightSum--valid']}`
    : weightSum > 100
      ? `${styles.weightSum} ${styles['weightSum--over']}`
      : styles.weightSum

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        <div className={styles.header}>
          <h2 className={styles.title}>
            {initial ? 'Редактировать правило' : 'Новое правило'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
            <X size={16} />
          </button>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Название *</label>
          <input
            className={`${styles.input}${fieldError('name') ? ` ${styles['input--error']}` : ''}`}
            value={values.name}
            onChange={e => setName(e.target.value)}
            placeholder="api-gateway-split"
            autoFocus
          />
          {fieldError('name') && <span className={styles.errorMsg}>{fieldError('name')}</span>}
        </div>

        <div className={styles.row}>
          <div className={`${styles.field} ${styles.priorityField}`}>
            <label className={styles.label}>Приоритет</label>
            <input
              type="number" min={0} max={1000}
              className={`${styles.input}${fieldError('priority') ? ` ${styles['input--error']}` : ''}`}
              value={values.priority}
              onChange={e => setPriority(Number(e.target.value))}
            />
            {fieldError('priority') && <span className={styles.errorMsg}>{fieldError('priority')}</span>}
          </div>
          <div className={`${styles.field} ${styles.pathField}`}>
            <label className={styles.label}>Path prefix</label>
            <input
              className={styles.input}
              value={values.match.pathPrefix ?? ''}
              onChange={e => setMatchField('pathPrefix', e.target.value)}
              placeholder="/api/v1/*"
            />
          </div>
        </div>

        <div className={styles.field}>
          <div className={styles.destinationsHeader}>
            <label className={styles.label} style={{ margin: 0 }}>Destinations *</label>
            <span className={weightSumClass}>{weightSum}/100%</span>
          </div>

          <div className={styles.destinationRows}>
            {values.destinations.map((d, i) => (
              <div key={i} className={styles.destinationRow}>
                <input
                  className={`${styles.input} ${styles.inputMono}`}
                  style={{ flex: 1 }}
                  value={d.version ?? ''}
                  onChange={e => setDestination(i, { version: e.target.value })}
                  placeholder="v1.2.0"
                />
                <input
                  type="number" min={0} max={100}
                  className={`${styles.input} ${styles.inputWeight}`}
                  value={d.weightPct}
                  onChange={e => setDestination(i, { weightPct: Number(e.target.value) })}
                />
                <span className={styles.weightUnit}>%</span>
                {values.destinations.length > 1 && (
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeDestination(i)}
                    aria-label="Удалить destination"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {values.destinations.some(d => d.version && d.weightPct > 0) && (
            <div className={styles.weightBarWrap}>
              <WeightBar destinations={values.destinations.filter(d => !!d.version)} />
            </div>
          )}

          {fieldError('destinations') && (
            <span className={styles.errorMsg}>{fieldError('destinations')}</span>
          )}

          <button className={styles.addBtn} onClick={addDestination}>
            <Plus size={12} /> Добавить destination
          </button>
        </div>

        <div className={styles.actions}>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>Отмена</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Сохранение…' : initial ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      </div>
    </div>
  )
}
