import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { RoutingRuleServiceImpl, NotFoundError } from './routing-rule.service.impl.js'

const makeRule = () => ({
  name:        'canary',
  priority:    10,
  serviceId:   'ignored-by-create',
  match:       { pathPrefix: '/api/v2' },
  destination: { version: 'v2', weightPct: 20 },
})

describe('RoutingRuleServiceImpl', () => {
  let svc: RoutingRuleServiceImpl
  const SERVICE_ID = 'aaaa-bbbb-cccc-0001'

  beforeEach(() => {
    svc = new RoutingRuleServiceImpl()
  })

  // ── list ───────────────────────────────────────────────────────────────

  it('returns empty array when no rules exist', () => {
    assert.deepEqual(svc.list(SERVICE_ID), [])
  })

  it('returns only rules for the given serviceId', () => {
    svc.create(SERVICE_ID,    makeRule())
    svc.create('other-svc',  makeRule())
    const rules = svc.list(SERVICE_ID)
    assert.equal(rules.length, 1)
    assert.equal(rules[0].serviceId, SERVICE_ID)
  })

  it('returns rules sorted by priority asc', () => {
    svc.create(SERVICE_ID, { ...makeRule(), priority: 50 })
    svc.create(SERVICE_ID, { ...makeRule(), priority: 10 })
    svc.create(SERVICE_ID, { ...makeRule(), priority: 30 })
    const priorities = svc.list(SERVICE_ID).map(r => r.priority)
    assert.deepEqual(priorities, [10, 30, 50])
  })

  // ── create ────────────────────────────────────────────────────────────

  it('creates a rule and assigns id + timestamps', () => {
    const rule = svc.create(SERVICE_ID, makeRule())
    assert.ok(rule.id,        'id should be set')
    assert.ok(rule.createdAt, 'createdAt should be set')
    assert.ok(rule.updatedAt, 'updatedAt should be set')
    assert.equal(rule.serviceId, SERVICE_ID)
    assert.equal(rule.name,      'canary')
    assert.equal(rule.priority,  10)
  })

  it('stores rule so list returns it', () => {
    const created = svc.create(SERVICE_ID, makeRule())
    const listed  = svc.list(SERVICE_ID)
    assert.equal(listed.length, 1)
    assert.equal(listed[0].id, created.id)
  })

  // ── update ───────────────────────────────────────────────────────────

  it('updates only provided fields (partial update)', () => {
    const rule    = svc.create(SERVICE_ID, makeRule())
    const updated = svc.update(rule.id, { priority: 99 })
    assert.equal(updated.priority, 99)
    assert.equal(updated.name, 'canary') // не тронулось
  })

  it('bumps updatedAt on update', async () => {
    const rule = svc.create(SERVICE_ID, makeRule())
    await new Promise(r => setTimeout(r, 5))
    const updated = svc.update(rule.id, { priority: 99 })
    assert.ok(updated.updatedAt > rule.updatedAt, 'updatedAt should increase')
  })

  it('throws NotFoundError when updating unknown ruleId', () => {
    assert.throws(
      () => svc.update('non-existent-id', { priority: 1 }),
      NotFoundError,
    )
  })

  // ── delete ───────────────────────────────────────────────────────────

  it('deletes a rule so it no longer appears in list', () => {
    const rule = svc.create(SERVICE_ID, makeRule())
    svc.delete(rule.id)
    assert.deepEqual(svc.list(SERVICE_ID), [])
  })

  it('throws NotFoundError when deleting unknown ruleId', () => {
    assert.throws(
      () => svc.delete('non-existent-id'),
      NotFoundError,
    )
  })
})
