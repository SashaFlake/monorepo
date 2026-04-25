import type { ZodTypeAny, z } from 'zod'

/**
 * Типизированный контракт одного эндпоинта.
 * Служит единственным источником правды для:
 *   - валидации входящих данных
 *   - типизации хендлера
 *   - генерации документации
 */
export interface RouteContract<
    TBody extends ZodTypeAny = ZodTypeAny,
    TParams extends ZodTypeAny = ZodTypeAny,
    TQuery extends ZodTypeAny = ZodTypeAny,
    TResponse extends ZodTypeAny = ZodTypeAny,
> {
    readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    readonly path: string
    readonly summary: string
    readonly body?: TBody
    readonly params?: TParams
    readonly query?: TQuery
    readonly response: TResponse
}