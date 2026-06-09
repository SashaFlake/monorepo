import { describe, it, expect } from 'vitest'
import { Schema } from 'effect'
import { schemaValidator } from './schemaResolver.domain'

const Person = Schema.Struct({
  name: Schema.String.pipe(Schema.filter(s => s.length > 0 || 'Name required')),
  age: Schema.Number.pipe(Schema.filter(n => n >= 0 || 'Age must be ≥ 0')),
})

describe('schemaValidator', () => {
  it('returns [] when the value decodes successfully', () => {
    const validate = schemaValidator(Person)
    expect(validate({ name: 'Ada', age: 30 })).toEqual([])
  })

  it('reports a single field error', () => {
    const validate = schemaValidator(Person)
    const errors = validate({ name: '', age: 30 })
    expect(errors.length).toBeGreaterThanOrEqual(1)
    expect(errors.some(e => e.field === 'name')).toBe(true)
  })

  it('collects all errors at once instead of failing fast', () => {
    const validate = schemaValidator(Person)
    const errors = validate({ name: '', age: -1 })
    expect(errors.some(e => e.field === 'name')).toBe(true)
    expect(errors.some(e => e.field === 'age')).toBe(true)
  })

  it('reports a missing required field via its key', () => {
    const validate = schemaValidator(Person)
    const errors = validate({ age: 10 })
    expect(errors.some(e => e.field === 'name')).toBe(true)
  })

  it('reports the wrong type at the field level', () => {
    const validate = schemaValidator(Person)
    const errors = validate({ name: 'Ada', age: 'thirty' })
    expect(errors.some(e => e.field === 'age')).toBe(true)
  })

  it('uses the last path segment as field for nested structures', () => {
    const Nested = Schema.Struct({
      profile: Schema.Struct({
        nickname: Schema.String.pipe(Schema.filter(s => s.length > 0 || 'required')),
      }),
    })
    const validate = schemaValidator(Nested)
    const errors = validate({ profile: { nickname: '' } })
    expect(errors[0].field).toBe('nickname')
  })
})
