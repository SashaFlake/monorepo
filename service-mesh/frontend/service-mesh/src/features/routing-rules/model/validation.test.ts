import { describe, it, expect } from 'vitest'
import { sumWeights, validateWeights, validateRule } from './validation'
import type { Destination, RuleFormValues } from './types'

const dest = (version: string, weightPct: number): Destination => ({ version, weightPct })

const validForm = (overrides?: Partial<RuleFormValues>): RuleFormValues => ({
  name: 'my-rule',
  priority: 100,
  match: { pathPrefix: '/api/*' },
  destinations: [dest('v1', 100)],
  ...overrides,
})

describe('sumWeights', () => {
  it('returns 0 for empty array', () => {
    expect(sumWeights([])).toBe(0)
  })

  it('sums weights of all destinations', () => {
    expect(sumWeights([dest('v1', 80), dest('v2', 20)])).toBe(100)
  })

  it('works with a single destination', () => {
    expect(sumWeights([dest('v1', 100)])).toBe(100)
  })

  it('works with incomplete distribution', () => {
    expect(sumWeights([dest('v1', 30), dest('v2', 30)])).toBe(60)
  })
})

describe('validateWeights', () => {
  it('returns ok when sum equals 100', () => {
    expect(validateWeights([dest('v1', 60), dest('v2', 40)]).ok).toBe(true)
  })

  it('returns error when sum is less than 100', () => {
    const result = validateWeights([dest('v1', 60)])
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors[0].field).toBe('destinations')
      expect(result.errors[0].message).toContain('60%')
    }
  })

  it('returns error when sum exceeds 100', () => {
    const result = validateWeights([dest('v1', 80), dest('v2', 40)])
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors[0].message).toContain('120%')
    }
  })

  it('returns ok for a single destination with weight 100', () => {
    expect(validateWeights([dest('v1', 100)]).ok).toBe(true)
  })
})

describe('validateRule', () => {
  it('passes validation for valid values', () => {
    expect(validateRule(validForm()).ok).toBe(true)
  })

  it('returns error when name is empty', () => {
    const result = validateRule(validForm({ name: '' }))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some(e => e.field === 'name')).toBe(true)
    }
  })

  it('returns error when name is whitespace only', () => {
    expect(validateRule(validForm({ name: '   ' })).ok).toBe(false)
  })

  it('returns error when priority is below 0', () => {
    const result = validateRule(validForm({ priority: -1 }))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some(e => e.field === 'priority')).toBe(true)
    }
  })

  it('returns error when priority exceeds 1000', () => {
    expect(validateRule(validForm({ priority: 1001 })).ok).toBe(false)
  })

  it('returns error when destinations array is empty', () => {
    const result = validateRule(validForm({ destinations: [] }))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some(e => e.field === 'destinations')).toBe(true)
    }
  })

  it('returns error when weights do not sum to 100', () => {
    expect(validateRule(validForm({ destinations: [dest('v1', 70), dest('v2', 20)] })).ok).toBe(false)
  })

  it('collects all errors at once', () => {
    const result = validateRule({ name: '', priority: -1, match: {}, destinations: [] })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThanOrEqual(3)
    }
  })
})
