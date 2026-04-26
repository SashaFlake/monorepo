import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { RoutingRuleServiceImpl, NotFoundError } from './routing-rule.service.impl.js'

const SERVICE_A = 'aaaaaaaa-0000-0000-0000-000000000001'
const SERVICE_B = 'bbbbbbbb-0000-0000-0000-000000000002'

const aRule = (overrides = {}) => ({
  name:        'canary',
  priority:    10,
  serviceId:   SERVICE_A,
  match:       { pathPrefix: '/api/v2' },
  destination: { version: 'v2', weightPct: 20 },
  ...overrides,
})

describe('Routing Rule Management', () => {
  let svc: RoutingRuleServiceImpl

  beforeEach(() => {
    svc = new RoutingRuleServiceImpl()
  })

  describe('listing rules for a service', () => {
    it('returns an empty list before any rules are added', () => {
      assert.deepEqual(svc.list(SERVICE_A), [])
    })

    it('returns only rules that belong to the requested service', () => {
      svc.create(SERVICE_A, aRule())
      svc.create(SERVICE_B, aRule())

      const rules = svc.list(SERVICE_A)

      assert.equal(rules.length, 1)
      assert.equal(rules[0].serviceId, SERVICE_A)
    })

    it('returns rules ordered by priority ascending so higher-priority rules come first', () => {
      svc.create(SERVICE_A, aRule({ priority: 50 }))
      svc.create(SERVICE_A, aRule({ priority: 10 }))
      svc.create(SERVICE_A, aRule({ priority: 30 }))

      const priorities = svc.list(SERVICE_A).map(r => r.priority)

      assert.deepEqual(priorities, [10, 30, 50])
    })
  })

  describe('creating a rule', () => {
    it('assigns a unique id and timestamps to the new rule', () => {
      const rule = svc.create(SERVICE_A, aRule())

      assert.ok(rule.id)
      assert.equal(rule.serviceId, SERVICE_A)
      assert.ok(rule.createdAt)
      assert.ok(rule.updatedAt)
    })

    it('makes the rule immediately visible in the list', () => {
      const created = svc.create(SERVICE_A, aRule())

      const listed = svc.list(SERVICE_A)

      assert.equal(listed.length, 1)
      assert.equal(listed[0].id, created.id)
    })
  })

  describe('updating a rule', () => {
    it('changes only the provided fields, leaving the rest intact', () => {
      const rule = svc.create(SERVICE_A, aRule())

      const updated = svc.update(rule.id, { priority: 99 })

      assert.equal(updated.priority,  99)
      assert.equal(updated.name,      'canary')   // untouched
      assert.equal(updated.serviceId, SERVICE_A)  // untouched
    })

    it('advances updatedAt while keeping createdAt unchanged', async () => {
      const rule = svc.create(SERVICE_A, aRule())
      await new Promise(r => setTimeout(r, 5))

      const updated = svc.update(rule.id, { priority: 99 })

      assert.equal(updated.createdAt, rule.createdAt)  // unchanged
      assert.ok(updated.updatedAt > rule.updatedAt)    // advanced
    })

    it('throws NotFoundError when the rule does not exist', () => {
      assert.throws(
        () => svc.update('non-existent-id', { priority: 1 }),
        NotFoundError,
      )
    })
  })

  describe('deleting a rule', () => {
    it('removes the rule so it no longer appears in the list', () => {
      const rule = svc.create(SERVICE_A, aRule())

      svc.delete(rule.id)

      assert.deepEqual(svc.list(SERVICE_A), [])
    })

    it('throws NotFoundError when the rule does not exist', () => {
      assert.throws(
        () => svc.delete('non-existent-id'),
        NotFoundError,
      )
    })
  })
})
