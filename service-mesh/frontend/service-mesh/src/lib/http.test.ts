import { describe, it, expect, vi } from 'vitest'
import { Schema, Effect } from 'effect'
import { apiFetchEffect } from './http'

const TestSchema = Schema.Struct({ name: Schema.String })

describe('apiFetchEffect', () => {
  it('returns decoded data when response is ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ name: 'test' }),
    })

    const result = await Effect.runPromise(apiFetchEffect('/test', TestSchema))
    expect(result).toEqual({ name: 'test' })
  })

  it('fails when response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    })

    const result = await Effect.runPromise(Effect.either(apiFetchEffect('/test', TestSchema)))
    expect(result._tag).toBe('Left')
  })

  it('fails when JSON does not match schema', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ wrong: 'shape' }),
    })

    const result = await Effect.runPromise(Effect.either(apiFetchEffect('/test', TestSchema)))
    expect(result._tag).toBe('Left')
  })
})
