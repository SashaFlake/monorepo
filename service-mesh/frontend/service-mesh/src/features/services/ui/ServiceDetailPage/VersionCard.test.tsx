import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VersionCard } from './VersionCard'
import type { ServiceVersion } from '../../domain/services.types'

const version = (overrides: Partial<ServiceVersion> = {}): ServiceVersion => ({
  version:       'v1',
  instanceCount: 3,
  instances:     [],
  manifest:      {
    apiVersion: 'v1',
    kind:       'Service',
    metadata:   { name: 'test', version: 'v1', generatedAt: new Date().toISOString() },
    spec:       { exposure: 'public', protocol: 'http', ports: [], routing: { loadBalancing: 'round-robin', retries: 3, timeoutMs: 5000 }, health: { path: '/health', intervalMs: 1000, ttlMs: 30000 } },
  },
  ...overrides,
})

describe('VersionCard', () => {
  it('renders version name and count', () => {
    render(<VersionCard version={version()} serviceId="svc-1" />)
    expect(screen.getByText('vv1')).toBeInTheDocument()
    expect(screen.getByText('3 instances')).toBeInTheDocument()
  })
})
