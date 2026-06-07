import * as React from 'react'
import { Schema } from 'effect'
import { useServiceOpenApi } from '../../application/useServiceOpenApi.application'
import { OpenApiDocSchema, OpenApiOperationSchema } from '../../domain/schema'
import s from './ServiceDetailPage.module.css'

type OpenApiOperation = Schema.Schema.Type<typeof OpenApiOperationSchema>

type OpenApiRoute = OpenApiOperation & { method: string; path: string }

const isOpenApiOperation = Schema.is(OpenApiOperationSchema)

export function OpenApiPanel({ serviceId, version }: { serviceId: string; version: string }): React.ReactElement {
  const { data, isLoading, isError, error } = useServiceOpenApi(serviceId, version)

  if (isLoading) return <div className={s.openapiLoading}>Fetching OpenAPI from instance…</div>
  if (isError) return (
    <div className={s.openapiError}>
      <div className={s.openapiErrorTitle}>Could not fetch OpenAPI</div>
      <div className={s.openapiErrorMsg}>{error instanceof Error ? error.message : String(error)}</div>
      <div className={s.openapiErrorHint}>Make sure the instance exposes <code>/openapi.json</code></div>
    </div>
  )

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
