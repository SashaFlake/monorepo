import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { buildApp } from '../../../presentation/app.js'
import type { FastifyInstance } from 'fastify'

// ── Helpers ───────────────────────────────────────────────────────────────────

const postService = async (app: FastifyInstance, name = 'test-svc') => {
  const res = await app.inject({ method: 'POST', url: '/api/v1/services', payload: { name } })
  return JSON.parse(res.body) as { id: string }
}

const postRule = (app: FastifyInstance, serviceId: string, overrides = {}) =>
  app.inject({
    method:  'POST',
    url:     `/api/v1/services/${serviceId}/routing-rules`,
    payload: {
      name:        'canary',
      priority:    10,
      match:       { pathPrefix: '/api/v2' },
      destination: { version: 'v2', weightPct: 20 },
      ...overrides,
    },
  })

const body = <T>(res: { body: string }): T => JSON.parse(res.body)

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Routing Rule Management — HTTP API', () => {
  let app: FastifyInstance
  let serviceId: string

  before(async () => {
    app = await buildApp()
    serviceId = (await postService(app)).id
  })

  after(() => app.close())

  describe('listing rules for a service', () => {
    it('returns an empty list before any rules are added', async () => {
      const res = await app.inject({
        method: 'GET',
        url:    `/api/v1/services/${serviceId}/routing-rules`,
      })
      assert.equal(res.statusCode, 200)
      assert.deepEqual(body(res), [])
    })

    it('rejects a non-UUID serviceId with 400', async () => {
      const res = await app.inject({
        method: 'GET',
        url:    '/api/v1/services/not-a-uuid/routing-rules',
      })
      assert.equal(res.statusCode, 400)
    })
  })

  describe('creating a rule', () => {
    it('returns 201 with the created rule including its id', async () => {
      const res = await postRule(app, serviceId)

      assert.equal(res.statusCode, 201)
      const rule = body<{ id: string; serviceId: string; name: string; priority: number }>(res)
      assert.ok(rule.id)
      assert.equal(rule.serviceId, serviceId)
      assert.equal(rule.name,      'canary')
      assert.equal(rule.priority,  10)
    })

    it('rejects a request without a name with 400', async () => {
      const res = await app.inject({
        method:  'POST',
        url:     `/api/v1/services/${serviceId}/routing-rules`,
        payload: { priority: 10, match: {}, destination: { weightPct: 50 } },
      })
      assert.equal(res.statusCode, 400)
    })

    it('rejects weightPct above 100 with 400', async () => {
      const res = await postRule(app, serviceId, { destination: { weightPct: 999 } })
      assert.equal(res.statusCode, 400)
    })
  })

  describe('updating a rule', () => {
    it('applies partial changes while keeping other fields intact', async () => {
      const { id } = body<{ id: string }>(await postRule(app, serviceId))

      const res = await app.inject({
        method:  'PUT',
        url:     `/api/v1/routing-rules/${id}`,
        payload: { priority: 99 },
      })

      assert.equal(res.statusCode, 200)
      const rule = body<{ priority: number; name: string }>(res)
      assert.equal(rule.priority, 99)
      assert.equal(rule.name,     'canary')  // untouched
    })

    it('rejects a negative weightPct with 400', async () => {
      const { id } = body<{ id: string }>(await postRule(app, serviceId))

      const res = await app.inject({
        method:  'PUT',
        url:     `/api/v1/routing-rules/${id}`,
        payload: { destination: { weightPct: -1 } },
      })
      assert.equal(res.statusCode, 400)
    })

    it('rejects a non-UUID ruleId with 400', async () => {
      const res = await app.inject({
        method:  'PUT',
        url:     '/api/v1/routing-rules/not-a-uuid',
        payload: { priority: 1 },
      })
      assert.equal(res.statusCode, 400)
    })
  })

  describe('deleting a rule', () => {
    it('responds with 204 and no body', async () => {
      const { id } = body<{ id: string }>(await postRule(app, serviceId))

      const res = await app.inject({ method: 'DELETE', url: `/api/v1/routing-rules/${id}` })

      assert.equal(res.statusCode, 204)
    })

    it('removes the rule from the list permanently', async () => {
      const { id } = body<{ id: string }>(await postRule(app, serviceId))
      await app.inject({ method: 'DELETE', url: `/api/v1/routing-rules/${id}` })

      const res  = await app.inject({ method: 'GET', url: `/api/v1/services/${serviceId}/routing-rules` })
      const list = body<{ id: string }[]>(res)

      assert.ok(!list.some(r => r.id === id))
    })

    it('rejects a non-UUID ruleId with 400', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url:    '/api/v1/routing-rules/not-a-uuid',
      })
      assert.equal(res.statusCode, 400)
    })
  })
})
