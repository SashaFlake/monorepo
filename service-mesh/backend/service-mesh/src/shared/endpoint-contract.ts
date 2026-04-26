import type { ZodTypeAny } from 'zod'

/**
 * Typed contract for a single API endpoint.
 * Acts as the single source of truth for:
 *   - incoming data validation (Zod schemas)
 *   - handler type inference
 *   - future OpenAPI spec generation
 */
export interface EndpointContract<
  TBody extends ZodTypeAny = ZodTypeAny,
  TParams extends ZodTypeAny = ZodTypeAny,
  TQuery extends ZodTypeAny = ZodTypeAny,
  TResponse extends ZodTypeAny = ZodTypeAny,
> {
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  readonly path: string
  readonly summary: string
  readonly tags?: string[]
  readonly body?: TBody
  readonly params?: TParams
  readonly query?: TQuery
  readonly response: TResponse
}
