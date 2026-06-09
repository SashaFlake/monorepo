import { describe, it, expect } from 'vitest'
import type { RegistryStats } from './registry.types'

const makeStats = (overrides: Partial<RegistryStats> = {}): RegistryStats => ({
  totalServices: 0,
  totalInstances: 0,
  passingInstances: 0,
  degradedInstances: 0,
  criticalInstances: 0,
  ...overrides,
})

describe('RegistryStats', () => {
  it('can be constructed with all zeros', () => {
    const s = makeStats()
    expect(s.totalServices).toBe(0)
    expect(s.totalInstances).toBe(0)
    expect(s.passingInstances).toBe(0)
    expect(s.degradedInstances).toBe(0)
    expect(s.criticalInstances).toBe(0)
  })

  it('overrides work', () => {
    const s = makeStats({ totalServices: 5, criticalInstances: 2 })
    expect(s.totalServices).toBe(5)
    expect(s.criticalInstances).toBe(2)
  })
})
