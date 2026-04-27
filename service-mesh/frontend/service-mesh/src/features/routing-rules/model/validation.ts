import type { Destination, RuleFormValues } from './types'

// ── Чистые функции валидации (FP-first) ──────────────────────────────────────

export type ValidationError = { field: string; message: string }
export type ValidationResult = { ok: true } | { ok: false; errors: ValidationError[] }

const ok = (): ValidationResult => ({ ok: true })
const fail = (errors: ValidationError[]): ValidationResult => ({ ok: false, errors })

export const sumWeights = (destinations: Destination[]): number =>
  destinations.reduce((acc, d) => acc + d.weightPct, 0)

export const validateWeights = (destinations: Destination[]): ValidationResult => {
  const sum = sumWeights(destinations)
  return sum !== 100
    ? fail([{ field: 'destinations', message: `Сумма весов = ${sum}%, должно быть 100%` }])
    : ok()
}

export const validateRule = (values: RuleFormValues): ValidationResult => {
  const errors: ValidationError[] = []

  if (!values.name.trim())
    errors.push({ field: 'name', message: 'Название обязательно' })

  if (values.priority < 0 || values.priority > 1000)
    errors.push({ field: 'priority', message: 'Приоритет: 0–1000' })

  if (values.destinations.length === 0)
    errors.push({ field: 'destinations', message: 'Добавьте хотя бы один destination' })

  const weightsResult = validateWeights(values.destinations)
  if (!weightsResult.ok) errors.push(...weightsResult.errors)

  return errors.length > 0 ? fail(errors) : ok()
}
