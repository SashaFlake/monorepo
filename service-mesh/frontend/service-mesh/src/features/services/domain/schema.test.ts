import { describe, it, expect } from 'vitest'
import { Schema } from 'effect'
import {
  InstanceViewSchema,
  ServiceViewSchema,
  ServiceVersionsResponseSchema,
  OpenApiDocSchema,
} from './schema'

describe('InstanceViewSchema', () => {
  const validInstance = {
    id: 'i1',
    serviceId: 'svc-1',
    host: 'localhost',
    port: 8080,
    healthPath: '/health',
    metadata: {},
    registeredAt: '2026-01-01T00:00:00Z',
    lastHeartbeatAt: '2026-01-01T00:00:00Z',
    lastHealthCheck: null,
    status: 'passing',
  }

  it('decodes a valid instance', () => {
    const result = Schema.decodeUnknownSync(InstanceViewSchema)(validInstance)
    expect(result.id).toBe('i1')
    expect(result.status).toBe('passing')
  })

  it('decodes an instance with a health check', () => {
    const withHc = {
      ...validInstance,
      lastHealthCheck: { checkedAt: '2026-01-01T00:00:00Z', ok: true, statusCode: 200, latencyMs: 10 },
    }
    const result = Schema.decodeUnknownSync(InstanceViewSchema)(withHc)
    expect(result.lastHealthCheck?.ok).toBe(true)
  })

  it('fails on invalid status', () => {
    expect(() =>
      Schema.decodeUnknownSync(InstanceViewSchema)({ ...validInstance, status: 'unknown' }),
    ).toThrow()
  })
})

describe('ServiceViewSchema', () => {
  const validService = {
    id: 'svc-1',
    name: 'auth',
    labels: {},
    registeredAt: '2026-01-01T00:00:00Z',
    instances: [],
    worstStatus: 'passing',
  }

  it('decodes a valid service', () => {
    const result = Schema.decodeUnknownSync(ServiceViewSchema)(validService)
    expect(result.name).toBe('auth')
  })

  it('fails when name is missing', () => {
    expect(() => Schema.decodeUnknownSync(ServiceViewSchema)({ ...validService, name: undefined })).toThrow()
  })
})

describe('ServiceVersionsResponseSchema', () => {
  const validResponse = {
    serviceId: 'svc-1',
    serviceName: 'auth',
    versions: [
      {
        version: 'v1',
        instanceCount: 2,
        instances: [],
        manifest: {},
      },
    ],
  }

  it('decodes a valid response', () => {
    const result = Schema.decodeUnknownSync(ServiceVersionsResponseSchema)(validResponse)
    expect(result.versions.length).toBe(1)
    expect(result.versions[0].version).toBe('v1')
  })
})

describe('OpenApiDocSchema', () => {
  it('decodes a minimal OpenAPI doc', () => {
    const doc = {
      openapi: '3.0.0',
      info: { title: 'API', version: '1.0.0' },
      paths: {},
      tags: [{ name: 'default' }],
    }
    const result = Schema.decodeUnknownSync(OpenApiDocSchema)(doc)
    expect(result.info?.title).toBe('API')
  })

  it('decodes an empty object', () => {
    const result = Schema.decodeUnknownSync(OpenApiDocSchema)({})
    expect(result).toEqual({})
  })
})
