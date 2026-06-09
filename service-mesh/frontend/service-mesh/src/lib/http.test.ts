import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Schema, Effect } from 'effect'
import { apiFetchEffect, apiFetchVoidEffect, makeApiError, isApiError, BASE, endpoint } from './http'

const TestSchema = Schema.Struct({ name: Schema.String })

describe('http utilities', () => {
  it('endpoint prepends /api/v1', () => {
    expect(endpoint('/services')).toBe('/api/v1/services')
  })

  it('BASE has a default value', () => {
    expect(typeof BASE).toBe('string')
    expect(BASE.length).toBeGreaterThan(0)
  })

  it('makeApiError builds correct shape', () => {
    const err = makeApiError(404, 'Not Found', '/test')
    expect(err._tag).toBe('ApiError')
    expect(err.status).toBe(404)
    expect(err.statusText).toBe('Not Found')
    expect(err.path).toBe('/test')
    expect(err.message).toContain('404')
  })

  it('isApiError returns true for ApiError', () => {
    expect(isApiError(makeApiError(500, 'Server Error', '/x'))).toBe(true)
  })

  it('isApiError returns false for plain Error', () => {
    expect(isApiError(new Error('plain'))).toBe(false)
  })

  it('isApiError returns false for non-object', () => {
    expect(isApiError('string')).toBe(false)
  })
})

describe('apiFetchEffect', () => {
  const mockFetch = vi.fn<typeof global.fetch>()

  beforeEach(() => {
    Object.defineProperty(global, 'fetch', {
      value: mockFetch,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    mockFetch.mockClear()
  })

  it('returns decoded data when response is ok', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ name: 'test' }),
    })

    const result = await Effect.runPromise(apiFetchEffect('/test', TestSchema))
    expect(result).toEqual({ name: 'test' })
  })

  it('fails when response is not ok', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    })

    const result = await Effect.runPromise(Effect.either(apiFetchEffect('/test', TestSchema)))
    expect(result._tag).toBe('Left')
  })

  it('fails when JSON does not match schema', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ wrong: 'shape' }),
    })

    const result = await Effect.runPromise(Effect.either(apiFetchEffect('/test', TestSchema)))
    expect(result._tag).toBe('Left')
  })

  it('fails on network error', async () => {
    mockFetch.mockRejectedValue(new Error('network'))
    const result = await Effect.runPromise(Effect.either(apiFetchEffect('/test', TestSchema)))
    expect(result._tag).toBe('Left')
  })
})

describe('apiFetchVoidEffect', () => {
  const mockFetch = vi.fn<typeof global.fetch>()

  beforeEach(() => {
    Object.defineProperty(global, 'fetch', {
      value: mockFetch,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    mockFetch.mockClear()
  })

  it('succeeds on ok response', async () => {
    mockFetch.mockResolvedValue({ ok: true })
    const result = await Effect.runPromise(apiFetchVoidEffect('/test'))
    expect(result).toBeUndefined()
  })

  it('fails on non-ok response', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, statusText: 'Server Error' })
    const result = await Effect.runPromise(Effect.either(apiFetchVoidEffect('/test')))
    expect(result._tag).toBe('Left')
  })

  it('fails on network error', async () => {
    mockFetch.mockRejectedValue(new Error('network'))
    const result = await Effect.runPromise(Effect.either(apiFetchVoidEffect('/test')))
    expect(result._tag).toBe('Left')
  })
})
