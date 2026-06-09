import { describe, it, expect } from 'vitest'
import { persister, isIdbPersisterEnabled } from './persister'

describe('persister', () => {
  it('exports a persister object', () => {
    expect(persister).toBeDefined()
    expect(typeof persister.persistClient).toBe('function')
    expect(typeof persister.restoreClient).toBe('function')
    expect(typeof persister.removeClient).toBe('function')
  })

  it('exports isIdbPersisterEnabled as a boolean', () => {
    expect(typeof isIdbPersisterEnabled).toBe('boolean')
  })
})
