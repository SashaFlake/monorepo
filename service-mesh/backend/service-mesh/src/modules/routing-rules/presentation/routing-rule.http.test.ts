import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { buildApp } from '../../../presentation/app.js'
import type { FastifyInstance } from 'fastify'

// ────────────────────────────────────────────────────────────────────────
// Вспомогательные функции
// ────────────────────────────────────────────────────────────────────────

const createService = async (app: FastifyInstance, name = 'test-svc') => {
  const res = await app.inject({
    method: 'POST',
    url:    '/api/v1/services',
    payload: { name },
  })
  return JSON.parse(res.body) as { id: string }
}

const createRule = async (app: FastifyInstance, serviceId: string, overrides = {}) => {
  const res = await app.inject({
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
  return res
}

// ────────────────────────────────────────────────────────────────────────
// Тесты
// ────────────────────────────────────────────────────────────────────────

describe('Routing Rules HTTP', () => {
  let app: FastifyInstance
  let serviceId: string

  before(async () => {
    app = await buildApp()
    const svc = await createService(app)
    serviceId = svc.id
  })

  after(async () => {
    await app.close()
  })

  // ── GET /services/:serviceId/routing-rules ───────────────────────────────

  it('GET /routing-rules — returns empty array initially', async () => {
    const res = await app.inject({
      method: 'GET',
      url:    `/api/v1/services/${serviceId}/routing-rules`,
    })
    assert.equal(res.statusCode, 200)
    assert.deepEqual(JSON.parse(res.body), [])
  })

  it('GET /routing-rules — returns 400 for invalid serviceId', async () => {
    const res = await app.inject({
      method: 'GET',
      url:    '/api/v1/services/not-a-uuid/routing-rules',
    })
    assert.equal(res.statusCode, 400)
  })

  // ── POST /services/:serviceId/routing-rules ────────────────────────────

  it('POST /routing-rules — creates a rule, returns 201', async () => {
    const res = await createRule(app, serviceId)
    assert.equal(res.statusCode, 201)
    const body = JSON.parse(res.body)
    assert.ok(body.id)
    assert.equal(body.serviceId, serviceId)
    assert.equal(body.name, 'canary')
    assert.equal(body.priority, 10)
  })

  it('POST /routing-rules — returns 400 if name is missing', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     `/api/v1/services/${serviceId}/routing-rules`,
      payload: {
        priority:    10,
        match:       {},
        destination: { weightPct: 50 },
      },
    })
    assert.equal(res.statusCode, 400)
  })

  it('POST /routing-rules — returns 400 if weightPct > 100', async () => {
    const res = await createRule(app, serviceId, {
      destination: { weightPct: 999 },
    })
    assert.equal(res.statusCode, 400)
  })

  // ── PUT /routing-rules/:ruleId ──────────────────────────────────────────

  it('PUT /routing-rules/:id — updates a rule', async () => {
    const created = JSON.parse((await createRule(app, serviceId)).body)
    const res = await app.inject({
      method:  'PUT',
      url:     `/api/v1/routing-rules/${created.id}`,
      payload: { priority: 99 },
    })
    assert.equal(res.statusCode, 200)
    const body = JSON.parse(res.body)
    assert.equal(body.priority, 99)
    assert.equal(body.name, 'canary') // не стёрлось
  })

  it('PUT /routing-rules/:id — returns 400 if weightPct is negative', async () => {
    const created = JSON.parse((await createRule(app, serviceId)).body)
    const res = await app.inject({
      method:  'PUT',
      url:     `/api/v1/routing-rules/${created.id}`,
      payload: { destination: { weightPct: -1 } },
    })
    assert.equal(res.statusCode, 400)
  })

  it('PUT /routing-rules/:id — returns 400 for invalid ruleId', async () => {
    const res = await app.inject({
      method:  'PUT',
      url:     '/api/v1/routing-rules/not-a-uuid',
      payload: { priority: 1 },
    })
    assert.equal(res.statusCode, 400)
  })

  // ── DELETE /routing-rules/:ruleId ─────────────────────────────────────

  it('DELETE /routing-rules/:id — deletes a rule, returns 204', async () => {
    const created = JSON.parse((await createRule(app, serviceId)).body)
    const res = await app.inject({
      method: 'DELETE',
      url:    `/api/v1/routing-rules/${created.id}`,
    })
    assert.equal(res.statusCode, 204)
  })

  it('DELETE /routing-rules/:id — rule no longer in list after delete', async () => {
    const created = JSON.parse((await createRule(app, serviceId)).body)
    await app.inject({ method: 'DELETE', url: `/api/v1/routing-rules/${created.id}` })
    const list = await app.inject({
      method: 'GET',
      url:    `/api/v1/services/${serviceId}/routing-rules`,
    })
    const rules = JSON.parse(list.body) as { id: string }[]
    assert.ok(!rules.some(r => r.id === created.id))
  })

  it('DELETE /routing-rules/:id — returns 400 for invalid ruleId', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url:    '/api/v1/routing-rules/not-a-uuid',
    })
    assert.equal(res.statusCode, 400)
  })
})
