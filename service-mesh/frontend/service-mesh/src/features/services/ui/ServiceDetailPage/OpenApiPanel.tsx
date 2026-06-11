import * as React from 'react'
import { Schema } from 'effect'
import { useServiceOpenApi } from '../../application/useServiceOpenApi.application'
import { OpenApiDocSchema, OpenApiOperationSchema } from '../../domain/services.dto'
import s from './ServiceDetailPage.module.css'

/**
 * Inferred TypeScript type of a decoded OpenAPI operation.
 */
type OpenApiOperation = Schema.Schema.Type<typeof OpenApiOperationSchema>

/**
 * OpenAPI route enriched with its HTTP method and path.
 */
type OpenApiRoute = OpenApiOperation & { method: string; path: string }

/**
 * Type guard that narrows an unknown operation value to {@link OpenApiOperation}.
 *
 * @param value - Value to inspect
 * @returns `true` when the value matches {@link OpenApiOperationSchema}
 * @sideEffects none
 */
const isOpenApiOperation = Schema.is(OpenApiOperationSchema)

/**
 * Inspects a TanStack Query error and returns user-facing copy.
 *
 * @param error - The raw error from useQuery
 * @returns Object with title and body text
 * @sideEffects none
 */
function getErrorCopy(error: unknown): { title: string; body: string } {
    const msg = error instanceof Error ? error.message : String(error)
    const is502 = msg.includes('502')
    if(is502) {
        return {
            title: 'Instance does not expose OpenAPI',
            body: 'The service instance returned 502 Bad Gateway. It may not serve an OpenAPI specification at /openapi.json.',
        }
    }
    return { title: 'Could not fetch OpenAPI', body: msg }
}

/**
 * Renders the OpenAPI document exposed by a service version.
 *
 * Fetches `/services/{serviceId}/openapi?version={version}`, decodes the
 * response through {@link OpenApiDocSchema}, and lists the documented routes
 * in a table. Displays loading, error, and empty states.
 *
 * @param serviceId - Identifier of the service that owns the OpenAPI endpoint
 * @param version   - Service version whose OpenAPI document to display
 * @returns The OpenAPI panel element
 * @sideEffects Calls {@link useServiceOpenApi} (TanStack Query subscription)
 *              and decodes the document with Effect Schema on render.
 */
export function OpenApiPanel({ serviceId, version }: { serviceId: string; version: string }): React.ReactElement {
  const { data, isLoading, isError, error } = useServiceOpenApi(serviceId, version)

  if (isLoading) return <div className={s.openapiLoading}>Fetching OpenAPI from instance…</div>
  if (isError) {
    const { title, body } = getErrorCopy(error)
    return (
            <div className={s.openapiError}>
                <div className={s.openapiErrorTitle}>{title}</div>
                <div className={s.openapiErrorMsg}>{body}</div>
                <div className={s.openapiErrorHint}>Make sure the instance exposes <code>/openapi.json</code></div>
            </div>
        )
}

  const doc = Schema.decodeUnknownSync(OpenApiDocSchema)(data)
  const paths = doc?.paths ?? {}

  const routes: OpenApiRoute[] = Object.entries(paths).flatMap(([path, methods]) =>
    Object.entries(methods ?? {}).flatMap(([method, op]) => {
      if (!isOpenApiOperation(op)) return []
      return [{ method: method.toUpperCase(), path, ...op }]
    })
  )

  return (
    <div>
      {doc?.info && (
        <div className={s.openapiMeta}>
          <span className={s.openapiTitle}>{doc.info.title}</span>
          <span className={s.openapiVersion}>v{doc.info.version}</span>
          {doc.info.description && <span className={s.openapiDesc}>{doc.info.description}</span>}
          <span className={s.openapiSpec}>OpenAPI {doc.openapi}</span>
        </div>
      )}
      {routes.length === 0 ? (
        <div className={s.openapiLoading}>No paths defined in spec.</div>
      ) : (
        <table className={s.table}>
          <thead className={s.thead}>
            <tr><th className={s.th}>Method</th><th className={s.th}>Path</th><th className={s.th}>Summary</th><th className={s.th}>Tags</th></tr>
          </thead>
          <tbody>
            {routes.map((r) => (
              <tr key={`${r.method}-${r.path}`} className={`${s.row} ${r.deprecated ? s.deprecatedRow : ''}`}>
                <td className={s.td}>
                  <span className={s.methodBadge} data-method={r.method.toLowerCase()}>
                    {r.method}
                  </span>
                </td>
                <td className={`${s.td} ${s.monoXsMuted}`}>
                  {r.path}{r.deprecated && <span className={s.deprecated}>deprecated</span>}
                </td>
                <td className={`${s.td} ${s.tabularMuted}`}>{r.summary ?? '—'}</td>
                <td className={s.td}>
                  <div className={s.tagsList}>
                    {(r.tags ?? []).map(t => <span key={t} className={s.tagChip}>{t}</span>)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
