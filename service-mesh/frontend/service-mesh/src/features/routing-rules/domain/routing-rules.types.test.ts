import { describe, it, expect } from 'vitest'
import { Either } from 'effect'
import {
  emptyDestinationDraft,
  DestinationDraftEq,
  sumWeights,
  Destination,
} from './routing-rules.types'
import type { DestinationDraft } from './routing-rules.types'

describe('emptyDestinationDraft', () => {
  it('returns a draft with the supplied id and zeroed fields', () => {
    const d = emptyDestinationDraft('row-1')
    expect(d.id).toBe('row-1')
    expect(d.version).toBe('')
    expect(d.weightPct).toBe(0)
    expect(d.serviceId).toBeUndefined()
  })
})

describe('DestinationDraftEq', () => {
  it('considers drafts equivalent when semantic fields match', () => {
    const a: DestinationDraft = { id: 'a', version: 'v1', weightPct: 50, serviceId: 'svc' }
    const b: DestinationDraft = { id: 'b', version: 'v1', weightPct: 50, serviceId: 'svc' }
    expect(DestinationDraftEq(a, b)).toBe(true)
  })

  it('rejects drafts with different versions', () => {
    const a: DestinationDraft = { id: 'a', version: 'v1', weightPct: 50 }
    const b: DestinationDraft = { id: 'b', version: 'v2', weightPct: 50 }
    expect(DestinationDraftEq(a, b)).toBe(false)
  })

  it('rejects drafts with different weights', () => {
    const a: DestinationDraft = { id: 'a', version: 'v1', weightPct: 50 }
    const b: DestinationDraft = { id: 'b', version: 'v1', weightPct: 60 }
    expect(DestinationDraftEq(a, b)).toBe(false)
  })

  it('rejects drafts with different serviceIds', () => {
    const a: DestinationDraft = { id: 'a', version: 'v1', weightPct: 50, serviceId: 'svc-1' }
    const b: DestinationDraft = { id: 'b', version: 'v1', weightPct: 50, serviceId: 'svc-2' }
    expect(DestinationDraftEq(a, b)).toBe(false)
  })
})

describe('sumWeights', () => {
  it('sums all weight percentages', () => {
    const ds: DestinationDraft[] = [
      { id: '1', version: 'v1', weightPct: 30 },
      { id: '2', version: 'v2', weightPct: 70 },
    ]
    expect(sumWeights(ds)).toBe(100)
  })

  it('returns 0 for an empty array', () => {
    expect(sumWeights([])).toBe(0)
  })
})

describe('Destination.create', () => {
  const valid: DestinationDraft = { id: '1', version: 'v1', weightPct: 50 }

  it('returns Right for a valid draft', () => {
    const result = Destination.create(valid)
    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right).toEqual(valid)
    }
  })

  it('returns Left when version is blank', () => {
    const result = Destination.create({ ...valid, version: '' })
    expect(Either.isLeft(result)).toBe(true)
    if (Either.isLeft(result)) {
      expect(result.left).toEqual([{ field: 'version', message: 'Version is required' }])
    }
  })

  it('returns Left when version is whitespace-only', () => {
    const result = Destination.create({ ...valid, version: '   ' })
    expect(Either.isLeft(result)).toBe(true)
    if (Either.isLeft(result)) {
      expect(result.left.some(e => e.field === 'version')).toBe(true)
    }
  })

  it('returns Left when weightPct is negative', () => {
    const result = Destination.create({ ...valid, weightPct: -1 })
    expect(Either.isLeft(result)).toBe(true)
    if (Either.isLeft(result)) {
      expect(result.left).toEqual([{ field: 'weightPct', message: 'Weight must be 0–100' }])
    }
  })

  it('returns Left when weightPct exceeds 100', () => {
    const result = Destination.create({ ...valid, weightPct: 101 })
    expect(Either.isLeft(result)).toBe(true)
    if (Either.isLeft(result)) {
      expect(result.left).toEqual([{ field: 'weightPct', message: 'Weight must be 0–100' }])
    }
  })

  it('returns all errors when multiple fields are invalid', () => {
    const result = Destination.create({ id: '1', version: '', weightPct: 200 })
    expect(Either.isLeft(result)).toBe(true)
    if (Either.isLeft(result)) {
      expect(result.left).toHaveLength(2)
      expect(result.left.map(e => e.field)).toContain('version')
      expect(result.left.map(e => e.field)).toContain('weightPct')
    }
  })
})

describe('Destination.unsafe', () => {
  it('returns the draft typed as Destination without validation', () => {
    const draft: DestinationDraft = { id: '1', version: '', weightPct: -1 }
    const result = Destination.unsafe(draft)
    expect(result).toBe(draft)
  })
})
