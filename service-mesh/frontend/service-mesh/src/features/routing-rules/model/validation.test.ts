import {describe, it, expect} from 'vitest'
import {sumWeights, validateWeights, validateRule} from './validation'
import type {Destination, RuleFormValues} from './types'

const dest = ({
                  serviceId = crypto.randomUUID().toString(),
                  version,
                  weightPct = 1,
              }: { serviceId?: string; version: string; weightPct?: number; }): Destination => ({serviceId, version, weightPct});

const validForm = (overrides?: Partial<RuleFormValues>): RuleFormValues => ({
    name: 'api-split',
    priority: 100,
    match: {pathPrefix: '/api/*'},
    destinations: [dest({serviceId: crypto.randomUUID(), version: 'v1', weightPct: 100})],
    ...overrides,
})

describe('traffic distribution', () => {
    it('sums traffic share across all destinations', () => {
        expect(sumWeights([dest({version: 'v2', weightPct: 80}), dest({version: 'v1', weightPct: 20})])).toBe(100)
    })

    it('rejects split where some traffic has nowhere to go', () => {
        const result = validateWeights([dest({version: 'v1', weightPct: 60})])
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.errors[0].message).toContain('60%')
    })

    it('rejects split where traffic is over-allocated', () => {
        const result = validateWeights([dest({version: 'v1',weightPct: 80}), dest({version: 'v2', weightPct: 40})])
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.errors[0].message).toContain('120%')
    })

    it('accepts all traffic routed to a single destination', () => {
        expect(validateWeights([dest({version: 'v1', weightPct: 100})]).ok).toBe(true)
    })

    it('accepts a valid canary split across two versions', () => {
        expect(validateWeights([dest({version: 'v2', weightPct: 10}), dest({version: 'v1', weightPct: 90})]).ok).toBe(true)
    })
})

describe('routing rule form', () => {
    it('allows saving a fully configured rule', () => {
        expect(validateRule(validForm()).ok).toBe(true)
    })

    it('prevents saving a rule without a name', () => {
        const result = validateRule(validForm({name: ''}))
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.errors.some(e => e.field === 'name')).toBe(true)
    })

    it('prevents saving a rule with a whitespace-only name', () => {
        expect(validateRule(validForm({name: '   '})).ok).toBe(false)
    })

    it('prevents saving a rule with no destinations — matched traffic would be dropped', () => {
        const result = validateRule(validForm({destinations: []}))
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.errors.some(e => e.field === 'destinations')).toBe(true)
    })

    it('prevents saving when traffic is not fully distributed across destinations', () => {
        expect(validateRule(validForm({
            destinations: [dest({version:'v1', weightPct: 70}), dest({version: 'v2', weightPct: 20})],
        })).ok).toBe(false)
    })

    it('accepts priority at the lower boundary (0 = highest precedence)', () => {
        expect(validateRule(validForm({priority: 0})).ok).toBe(true)
    })

    it('accepts priority at the upper boundary (1000 = lowest precedence)', () => {
        expect(validateRule(validForm({priority: 1000})).ok).toBe(true)
    })

    it('rejects priority below 0', () => {
        expect(validateRule(validForm({priority: -1})).ok).toBe(false)
    })

    it('rejects priority above 1000', () => {
        expect(validateRule(validForm({priority: 1001})).ok).toBe(false)
    })

    it('reports all configuration errors at once', () => {
        const result = validateRule({name: '', priority: -1, match: {}, destinations: []})
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.errors.length).toBeGreaterThanOrEqual(3)
    })
})
