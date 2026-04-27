import { describe, it, expect } from 'vitest'
import { sumWeights, validateWeights, validateRule } from './validation'
import type { Destination, RuleFormValues } from './types'

const dest = (version: string, weightPct: number): Destination => ({ version, weightPct })

const validForm = (overrides?: Partial<RuleFormValues>): RuleFormValues => ({
  name: 'api-split',
  priority: 100,
  match: { pathPrefix: '/api/*' },
  destinations: [dest('v1', 100)],
  ...overrides,
})

// ---------------------------------------------------------------------------
// Traffic distribution
// ---------------------------------------------------------------------------

describe('traffic distribution', () => {
  it('calculates total traffic share across all destinations', () => {
    // 80% to v2 canary + 20% to v1 stable = full distribution
    expect(sumWeights([dest('v2', 80), dest('v1', 20)])).toBe(100)
  })

  it('detects unrouted traffic when weights do not add up to 100%', () => {
    // operator configured only 60% — 40% of traffic has nowhere to go
    const result = validateWeights([dest('v1', 60)])
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors[0].message).toContain('60%')
  })

  it('detects over-allocated traffic when weights exceed 100%', () => {
    // misconfigured split: 80 + 40 = 120% is impossible
    const result = validateWeights([dest('v1', 80), dest('v2', 40)])
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors[0].message).toContain('120%')
  })

  it('accepts a single destination receiving 100% of traffic', () => {
    // no canary — all traffic goes to stable
    expect(validateWeights([dest('v1', 100)]).ok).toBe(true)
  })

  it('accepts a valid canary split', () => {
    // classic canary: 10% new version, 90% stable
    expect(validateWeights([dest('v2', 10), dest('v1', 90)]).ok).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Routing rule form
// ---------------------------------------------------------------------------

describe('routing rule form', () => {
  it('allows saving a fully configured rule', () => {
    expect(validateRule(validForm()).ok).toBe(true)
  })

  it('prevents saving a rule without a name', () => {
    // operator must identify the rule — blank name is not allowed
    const result = validateRule(validForm({ name: '' }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.some(e => e.field === 'name')).toBe(true)
  })

  it('prevents saving a rule with a whitespace-only name', () => {
    expect(validateRule(validForm({ name: '   ' })).ok).toBe(false)
  })

  it('prevents saving a rule with no destinations', () => {
    // a rule with no destinations would drop all matched traffic
    const result = validateRule(validForm({ destinations: [] }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.some(e => e.field === 'destinations')).toBe(true)
  })

  it('prevents saving when traffic is not fully distributed', () => {
    // 70 + 20 = 90% — 10% of traffic would be unrouted
    expect(validateRule(validForm({
      destinations: [dest('v1', 70), dest('v2', 20)],
    })).ok).toBe(false)
  })

  it('enforces priority range 0–1000', () => {
    // priority drives rule evaluation order in the control plane
    expect(validateRule(validForm({ priority: -1 })).ok).toBe(false)
    expect(validateRule(validForm({ priority: 1001 })).ok).toBe(false)
    expect(validateRule(validForm({ priority: 0 })).ok).toBe(true)
    expect(validateRule(validForm({ priority: 1000 })).ok).toBe(true)
  })

  it('reports all configuration errors at once so the operator can fix them in one go', () => {
    const result = validateRule({ name: '', priority: -1, match: {}, destinations: [] })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.length).toBeGreaterThanOrEqual(3)
  })
})
