import { describe, it, expect } from 'vitest'
import { Either } from 'effect'
import { sumWeights, validateWeights, validateRule } from './validation'
import { Destination } from './types'
import type { RuleFormValues } from './types'

const dest = ({
  serviceId,
  version,
  weightPct = 1,
}: {
  serviceId?: string
  version: string
  weightPct?: number
}): Destination => Destination.unsafe({ serviceId, version, weightPct })

const validForm = (overrides?: Partial<RuleFormValues>): RuleFormValues => ({
  name: 'api-split',
  priority: 100,
  match: { pathPrefix: '/api/*' },
  destinations: [dest({ version: 'v1', weightPct: 100 })],
  ...overrides,
})

// ── helpers ───────────────────────────────────────────────────────────────────

const isOk  = <A>(r: Either.Either<A, unknown>): r is Either.Right<unknown, A> => Either.isRight(r)
const isFail = <E>(r: Either.Either<unknown, E>): r is Either.Left<E, unknown>  => Either.isLeft(r)
const errors = <E>(r: Either.Either<unknown, E[]>): E[] =>
  Either.isLeft(r) ? r.left : []

// ── traffic distribution ──────────────────────────────────────────────────────

describe('traffic distribution', () => {
  it('sums traffic share across all destinations', () => {
    expect(sumWeights([dest({ version: 'v2', weightPct: 80 }), dest({ version: 'v1', weightPct: 20 })])).toBe(100)
  })

  it('rejects split where some traffic has nowhere to go', () => {
    const result = validateWeights([dest({ version: 'v1', weightPct: 60 })])
    expect(isFail(result)).toBe(true)
    expect(errors(result)[0].message).toContain('60%')
  })

  it('rejects split where traffic is over-allocated', () => {
    const result = validateWeights([dest({ version: 'v1', weightPct: 80 }), dest({ version: 'v2', weightPct: 40 })])
    expect(isFail(result)).toBe(true)
    expect(errors(result)[0].message).toContain('120%')
  })

  it('accepts all traffic routed to a single destination', () => {
    expect(isOk(validateWeights([dest({ version: 'v1', weightPct: 100 })]))).toBe(true)
  })

  it('accepts a valid canary split across two versions', () => {
    expect(isOk(validateWeights([dest({ version: 'v2', weightPct: 10 }), dest({ version: 'v1', weightPct: 90 })]))).toBe(true)
  })
})

// ── routing rule form ─────────────────────────────────────────────────────────

describe('routing rule form', () => {
  it('allows saving a fully configured rule', () => {
    expect(isOk(validateRule(validForm()))).toBe(true)
  })

  it('prevents saving a rule without a name', () => {
    const result = validateRule(validForm({ name: '' }))
    expect(isFail(result)).toBe(true)
    expect(errors(result).some(e => e.field === 'name')).toBe(true)
  })

  it('prevents saving a rule with a whitespace-only name', () => {
    expect(isFail(validateRule(validForm({ name: '   ' })))).toBe(true)
  })

  it('prevents saving a rule with no destinations — matched traffic would be dropped', () => {
    const result = validateRule(validForm({ destinations: [] }))
    expect(isFail(result)).toBe(true)
    expect(errors(result).some(e => e.field === 'destinations')).toBe(true)
  })

  it('prevents saving when traffic is not fully distributed across destinations', () => {
    expect(isFail(validateRule(validForm({
      destinations: [dest({ version: 'v1', weightPct: 70 }), dest({ version: 'v2', weightPct: 20 })],
    })))).toBe(true)
  })

  it('accepts priority at the lower boundary (0 = highest precedence)', () => {
    expect(isOk(validateRule(validForm({ priority: 0 })))).toBe(true)
  })

  it('accepts priority at the upper boundary (1000 = lowest precedence)', () => {
    expect(isOk(validateRule(validForm({ priority: 1000 })))).toBe(true)
  })

  it('rejects priority below 0', () => {
    expect(isFail(validateRule(validForm({ priority: -1 })))).toBe(true)
  })

  it('rejects priority above 1000', () => {
    expect(isFail(validateRule(validForm({ priority: 1001 })))).toBe(true)
  })

  it('reports all configuration errors at once', () => {
    const result = validateRule({ name: '', priority: -1, match: {}, destinations: [] })
    expect(isFail(result)).toBe(true)
    expect(errors(result).length).toBeGreaterThanOrEqual(3)
  })
})
