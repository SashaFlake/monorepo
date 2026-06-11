import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OpenApiPanel } from './OpenApiPanel'

vi.mock('../../application/useServiceOpenApi.application', () => ({
  useServiceOpenApi: vi.fn(),
}))

import { useServiceOpenApi } from '../../application/useServiceOpenApi.application'

const mockedUseServiceOpenApi = vi.mocked(useServiceOpenApi)

describe('OpenApiPanel', () => {
  it('renders loading state', () => {
    mockedUseServiceOpenApi.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useServiceOpenApi>)

    render(<OpenApiPanel serviceId="svc-1" version="v1" />)
    expect(screen.getByText(/Fetching OpenAPI from instance/i)).toBeInTheDocument()
  })

  it('renders error state', () => {
    mockedUseServiceOpenApi.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('boom'),
    } as unknown as ReturnType<typeof useServiceOpenApi>)

    render(<OpenApiPanel serviceId="svc-1" version="v1" />)
    expect(screen.getByText(/Could not fetch OpenAPI/i)).toBeInTheDocument()
  })

  it('renders routes when data is available', () => {
    mockedUseServiceOpenApi.mockReturnValue({
      data: {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
          '/health': {
            get: { summary: 'Health check', operationId: 'health', tags: ['system'] },
          },
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useServiceOpenApi>)

    render(<OpenApiPanel serviceId="svc-1" version="v1" />)
    expect(screen.getByText('Test API')).toBeInTheDocument()
    expect(screen.getByText('Health check')).toBeInTheDocument()
  })

  it('renders specific copy for 502 Bad Gateway', () => {
    mockedUseServiceOpenApi.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('502 Bad Gateway: /api/v1/services/svc-1/openapi?version=v1'),
    } as unknown as ReturnType<typeof useServiceOpenApi>)

    render(<OpenApiPanel serviceId="svc-1" version="v1" />)
    expect(screen.getByText(/Instance does not expose OpenAPI/i)).toBeInTheDocument()
    expect(screen.getByText(/returned 502 Bad Gateway/i)).toBeInTheDocument()
  })
})
