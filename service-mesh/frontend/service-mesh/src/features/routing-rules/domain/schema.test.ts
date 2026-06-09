import { describe, it, expect } from 'vitest'
import { schemaValidator } from '@/shared/form/schemaResolver.domain'
import { RuleFormSchema } from './routing-rules.dto'
import type { DestinationDraft, RuleFormValues } from './routing-rules.types'

const validate = schemaValidator(RuleFormSchema)

const dest = ({
  serviceId,
  version,
  weightPct = 1,
}: {
  serviceId?: string
  version: string
  weightPct?: number
}): DestinationDraft => ({
  id: crypto.randomUUID(),
  serviceId,
  version,
  weightPct,
})

const validForm = (overrides?: Partial<RuleFormValues>): RuleFormValues => ({
  name: 'api-split',
  priority: 100,
  match: { pathPrefix: '/api/*' },
  destinations: [dest({ version: 'v1', weightPct: 100 })],
  ...overrides,
})

// Mirrors validation.test.ts so we can verify the Schema description has
// parity with the legacy hand-written validator before we cut over in PR 3b.

describe('RuleFormSchema — parity with validation.ts', () => {
  it('accepts a fully configured rule', () => {
    expect(validate(validForm())).toEqual([])
  })

  it('rejects a rule without a name', () => {
    const errors = validate(validForm({ name: '' }))
    expect(errors.some(e => e.field === 'name')).toBe(true)
  })

  it('rejects a whitespace-only name', () => {
    const errors = validate(validForm({ name: '   ' }))
    expect(errors.some(e => e.field === 'name')).toBe(true)
  })

  it('rejects an empty destinations list', () => {
    const errors = validate(validForm({ destinations: [] }))
    expect(errors.some(e => e.field === 'destinations')).toBe(true)
  })

  it('rejects when traffic is not fully distributed (sum < 100%)', () => {
    const errors = validate(
      validForm({
        destinations: [dest({ version: 'v1', weightPct: 70 }), dest({ version: 'v2', weightPct: 20 })],
      }),
    )
    expect(errors.some(e => e.message.includes('90%'))).toBe(true)
  })

  it('rejects when traffic is over-allocated (sum > 100%)', () => {
    const errors = validate(
      validForm({
        destinations: [dest({ version: 'v1', weightPct: 80 }), dest({ version: 'v2', weightPct: 40 })],
      }),
    )
    expect(errors.some(e => e.message.includes('120%'))).toBe(true)
  })

  it('rejects duplicate versions across destinations', () => {
    const errors = validate(
      validForm({
        destinations: [dest({ version: 'v1', weightPct: 50 }), dest({ version: 'v1', weightPct: 50 })],
      }),
    )
    expect(errors.some(e => e.message.toLowerCase().includes('duplicate'))).toBe(true)
  })

  it('accepts priority at the lower boundary (0)', () => {
    expect(validate(validForm({ priority: 0 }))).toEqual([])
  })

  it('accepts priority at the upper boundary (1000)', () => {
    expect(validate(validForm({ priority: 1000 }))).toEqual([])
  })

  it('rejects priority below 0', () => {
    const errors = validate(validForm({ priority: -1 }))
    expect(errors.some(e => e.field === 'priority')).toBe(true)
  })

  it('rejects priority above 1000', () => {
    const errors = validate(validForm({ priority: 1001 }))
    expect(errors.some(e => e.field === 'priority')).toBe(true)
  })

  it('reports all configuration errors at once', () => {
    const errors = validate({ name: '', priority: -1, match: {}, destinations: [] })
    expect(errors.length).toBeGreaterThanOrEqual(3)
  })

  it('rejects a destination with a blank version', () => {
    const errors = validate(
      validForm({
        destinations: [dest({ version: '', weightPct: 100 })],
      }),
    )
    expect(errors.some(e => e.field === 'version')).toBe(true)
  })
})
