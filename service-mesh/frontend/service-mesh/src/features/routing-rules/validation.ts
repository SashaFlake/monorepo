// ---------------------------------------------------------------------------
// Routing Rules — чистые функции валидации (FP-first)
// ---------------------------------------------------------------------------

import type { Upstream, RuleFormValues } from './types'

export type ValidationError = { field: string; message: string }
export type ValidationResult = { valid: true } | { valid: false; errors: ValidationError[] }

// --- Вспомогательные ---

const sumWeights = (upstreams: Upstream[]): number =>
  upstreams.reduce((acc, u) => acc + u.weight, 0)

const isEmpty = (s: string): boolean => s.trim().length === 0

// --- Валидаторы отдельных полей ---

const validateName = (name: string): ValidationError[] =>
  isEmpty(name)
    ? [{ field: 'name', message: 'Название правила обязательно' }]
    : []

const validateUpstreamsNotEmpty = (upstreams: Upstream[]): ValidationError[] =>
  upstreams.length === 0
    ? [{ field: 'upstreams', message: 'Добавьте хотя бы один upstream' }]
    : []

const validateUpstreamServices = (upstreams: Upstream[]): ValidationError[] =>
  upstreams
    .filter(u => isEmpty(u.serviceId))
    .map((_, i) => ({ field: `upstreams.${i}.serviceId`, message: `Upstream ${i + 1}: выберите сервис` }))

const validateWeights = (upstreams: Upstream[]): ValidationError[] => {
  if (upstreams.length === 0) return []
  const total = sumWeights(upstreams)
  return total !== 100
    ? [{ field: 'upstreams', message: `Сумма weights = ${total}%, должно быть 100%` }]
    : []
}

// --- Публичные функции ---

export const validateRule = (values: RuleFormValues): ValidationResult => {
  const errors: ValidationError[] = [
    ...validateName(values.name),
    ...validateUpstreamsNotEmpty(values.upstreams),
    ...validateUpstreamServices(values.upstreams),
    ...validateWeights(values.upstreams),
  ]
  return errors.length === 0 ? { valid: true } : { valid: false, errors }
}

export const getWeightSum = (upstreams: Upstream[]): number => sumWeights(upstreams)

export const getRemainingWeight = (upstreams: Upstream[], excludeIndex?: number): number => {
  const filtered = excludeIndex !== undefined
    ? upstreams.filter((_, i) => i !== excludeIndex)
    : upstreams
  return 100 - sumWeights(filtered)
}

export const isWeightSumValid = (upstreams: Upstream[]): boolean =>
  upstreams.length > 0 && sumWeights(upstreams) === 100
