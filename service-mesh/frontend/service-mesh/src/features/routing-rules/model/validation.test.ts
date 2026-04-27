import { describe, it, expect } from 'vitest'
import {
  sumWeights,
  validateWeights,
  validateRule,
} from './validation'
import type { Destination, RuleFormValues } from './types'

// ── фикстуры ──────────────────────────────────────────────────────────────────

const dest = (version: string, weightPct: number): Destination => ({ version, weightPct })

const validForm = (overrides?: Partial<RuleFormValues>): RuleFormValues => ({
  name: 'my-rule',
  priority: 100,
  match: { pathPrefix: '/api/*' },
  destinations: [dest('v1', 100)],
  ...overrides,
})

// ── sumWeights ───────────────────────────────────────────────────────────────────

describe('sumWeights', () => {
  it('возвращает 0 для пустого массива', () => {
    expect(sumWeights([])).toBe(0)
  })

  it('суммирует веса всех destinations', () => {
    expect(sumWeights([dest('v1', 80), dest('v2', 20)])).toBe(100)
  })

  it('работает с одним destination', () => {
    expect(sumWeights([dest('v1', 100)])).toBe(100)
  })

  it('работает с неполным распределением', () => {
    expect(sumWeights([dest('v1', 30), dest('v2', 30)])).toBe(60)
  })
})

// ── validateWeights ────────────────────────────────────────────────────────────

describe('validateWeights', () => {
  it('ок когда сумма = 100', () => {
    const result = validateWeights([dest('v1', 60), dest('v2', 40)])
    expect(result.ok).toBe(true)
  })

  it('ошибка когда сумма < 100', () => {
    const result = validateWeights([dest('v1', 60)])
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors[0].field).toBe('destinations')
      expect(result.errors[0].message).toContain('60%')
    }
  })

  it('ошибка когда сумма > 100', () => {
    const result = validateWeights([dest('v1', 80), dest('v2', 40)])
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors[0].message).toContain('120%')
    }
  })

  it('ок для одного destination с весом 100', () => {
    expect(validateWeights([dest('v1', 100)]).ok).toBe(true)
  })
})

// ── validateRule ─────────────────────────────────────────────────────────────────

describe('validateRule', () => {
  it('проходит валидацию для правильных значений', () => {
    expect(validateRule(validForm()).ok).toBe(true)
  })

  it('ошибка если name пустой', () => {
    const result = validateRule(validForm({ name: '' }))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some(e => e.field === 'name')).toBe(true)
    }
  })

  it('ошибка если name состоит из пробелов', () => {
    const result = validateRule(validForm({ name: '   ' }))
    expect(result.ok).toBe(false)
  })

  it('ошибка если priority < 0', () => {
    const result = validateRule(validForm({ priority: -1 }))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some(e => e.field === 'priority')).toBe(true)
    }
  })

  it('ошибка если priority > 1000', () => {
    const result = validateRule(validForm({ priority: 1001 }))
    expect(result.ok).toBe(false)
  })

  it('ошибка если destinations пустой массив', () => {
    const result = validateRule(validForm({ destinations: [] }))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some(e => e.field === 'destinations')).toBe(true)
    }
  })

  it('ошибка если сумма весов не 100', () => {
    const result = validateRule(validForm({ destinations: [dest('v1', 70), dest('v2', 20)] }))
    expect(result.ok).toBe(false)
  })

  it('собирает все ошибки сразу', () => {
    const result = validateRule({ name: '', priority: -1, match: {}, destinations: [] })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThanOrEqual(3)
    }
  })
})
