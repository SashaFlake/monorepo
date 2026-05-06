import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Schema } from 'effect'
import { registryApi, registryKeys } from '../api/api'
import s from '../ServiceDetailPage.module.css'

const HTTP_METHOD_COLOR: Record<string, string> = {
  get:     'var(--color-success)',
  post:    'var(--color-primary)',
  put:     'var(--color-warning)',
  patch:   'var(--color-orange)',
  delete:  'var(--color-error)',
  head:    'var(--color-text-muted)',
  options: 'var(--color-text-muted)',
}

type OpenApiOperation = {
  summary?: string
  operationId?: string
  deprecated?: boolean
  tags?: string[]
}

type OpenApiRoute = OpenApiOperation & { method: string; path: string }

const OpenApiDocSchema = Schema.Struct({
  openapi: Schema.optional(Schema.String),
  info: Schema.optional(Schema.Struct({
    title: Schema.optional(Schema.String),
    version: Schema.optional(Schema.String),
    description: Schema.optional(Schema.String),
  })),
  paths: Schema.optional(Schema.Record({
    key: Schema.String,
    value: Schema.Record({
      key: Schema.String,
      value: Schema.Struct({
        summary: Schema.optional(Schema.String),
        operationId: Schema.optional(Schema.String),
        tags: Schema.optional(Schema.Array(Schema.String)),
        deprecated: Schema.optional(Schema.Boolean),
      }),
    }),
  })),
})

export function OpenApiPanel({ serviceId, version }: { serviceId: string; version: string }): React.ReactElement {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: registryKeys.openapi(serviceId, version),
    queryFn:  () => registryApi.getServiceOpenApi(serviceId, version),
    retry: false,
    staleTime: 30_000,
  })

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
      if (!op || typeof op !== 'object') return []
      const operation = op as OpenApiOperation
      return [{ method: method.toUpperCase(), path, ...operation }]
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
              <tr key={`${r.method}-${r.path}`} className={s.row} style={{ opacity: r.deprecated ? 0.5 : 1 }}>
                <td className={s.td}>
                  <span className={s.methodBadge} style={{ color: HTTP_METHOD_COLOR[r.method.toLowerCase()] ?? 'var(--color-text)' }}>
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
