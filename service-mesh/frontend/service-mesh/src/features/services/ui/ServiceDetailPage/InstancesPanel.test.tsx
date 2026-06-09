import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InstancesPanel } from './InstancesPanel'
import type { ServiceVersion } from '../../domain/services.types'

const version = (): ServiceVersion => ({
  version:       'v1',
  instanceCount: 1,
  instances:     [
    {
      id:              'inst-1',
      serviceId:       'svc-1',
      host:            '10.0.0.1',
      port:            8080,
      healthPath:      '/health',
      metadata:        {},
      registeredAt:    new Date().toISOString(),
      lastHeartbeatAt: new Date().toISOString(),
      lastHealthCheck: { checkedAt: new Date().toISOString(), ok: true, statusCode: 200, latencyMs: 12 },
      status:          'passing' as const,
    },
    {
      id:              'inst-2',
      serviceId:       'svc-1',
      host:            '10.0.0.2',
      port:            8080,
      healthPath:      '/health',
      metadata:        {},
      registeredAt:    new Date().toISOString(),
      lastHeartbeatAt: new Date().toISOString(),
      lastHealthCheck: { checkedAt: new Date().toISOString(), ok: false, statusCode: 500, latencyMs: 45 },
      status:          'critical' as const,
    },
  ],
  manifest: {
    apiVersion: 'v1',
    kind:       'Service',
    metadata:   { name: 'test', version: 'v1', generatedAt: new Date().toISOString() },
    spec:       { exposure: 'public', protocol: 'http', ports: [], routing: { loadBalancing: 'round-robin', retries: 3, timeoutMs: 5000 }, health: { path: '/health', intervalMs: 1000, ttlMs: 30000 } },
  },
})

describe('InstancesPanel', () => {
  it('renders instance rows', () => {
    render(<InstancesPanel version={version()} />)
    expect(screen.getByText('10.0.0.1')).toBeInTheDocument()
    expect(screen.getByText('10.0.0.2')).toBeInTheDocument()
  })

  it('shows health check status', () => {
    render(<InstancesPanel version={version()} />)
    expect(screen.getByText(/✓/)).toBeInTheDocument()
    expect(screen.getByText(/✗/)).toBeInTheDocument()
  })
})
