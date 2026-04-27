import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RoutingRulesPage } from '@/features/routing-rules/RoutingRulesPage'
import { registryApi, registryKeys } from './api/api'
import type { InstanceStatus, ServiceVersion, OpenApiDoc } from './api/types'
import s from './ServiceDetailPage.module.css'

const STATUS_VARIANT: Record<InstanceStatus, 'success' | 'warning' | 'error'> = {
  passing:  'success',
  warning:  'warning',
  critical: 'error',
}

const HTTP_METHOD_COLOR: Record<string, string> = {
  get:     'var(--color-success)',
  post:    'var(--color-primary)',
  put:     'var(--color-warning)',
  patch:   'var(--color-orange)',
  delete:  'var(--color-error)',
  head:    'var(--color-text-muted)',
  options: 'var(--color-text-muted)',
}

function ManifestPanel({ version }: { version: ServiceVersion }) {
  const m = version.manifest
  return (
    <div>
      <div className={s.manifestMeta}>
        <span className={s.chip}>{m.apiVersion}</span>
        <span className={`${s.chip} ${s.chipPrimary}`}>{m.kind}</span>
        <span className={s.manifestTimestamp}>generated {new Date(m.metadata.generatedAt).toLocaleTimeString()}</span>
      </div>
      <div className={s.specsGrid}>
        <SpecCard title="Exposure"><KV k="exposure" v={m.spec.exposure} /><KV k="protocol" v={m.spec.protocol} /></SpecCard>
        <SpecCard title="Ports">{m.spec.ports.map(p => <KV key={p.name} k={p.name} v={`${p.port} → ${p.targetPort} (${p.protocol})`} />)}</SpecCard>
        <SpecCard title="Routing"><KV k="load balancing" v={m.spec.routing.loadBalancing} /><KV k="retries" v={String(m.spec.routing.retries)} /><KV k="timeout" v={`${m.spec.routing.timeoutMs}ms`} /></SpecCard>
        <SpecCard title="Health"><KV k="path" v={m.spec.health.path} /><KV k="interval" v={`${m.spec.health.intervalMs / 1000}s`} /><KV k="ttl" v={`${m.spec.health.ttlMs / 1000}s`} /></SpecCard>
      </div>
    </div>
  )
}

function SpecCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={s.specCard}>
      <div className={s.specCardTitle}>{title}</div>
      <div className={s.specCardBody}>{children}</div>
    </div>
  )
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className={s.kv}>
      <span className={s.kvKey}>{k}</span>
      <span className={s.kvValue}>{v}</span>
    </div>
  )
}

function OpenApiPanel({ serviceId, version }: { serviceId: string; version: string }) {
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
      <div className={s.openapiErrorMsg}>{(error as Error).message}</div>
      <div className={s.openapiErrorHint}>Make sure the instance exposes <code>/openapi.json</code></div>
    </div>
  )

  const doc = data as OpenApiDoc
  const paths = doc?.paths ?? {}
  const routes: Array<{ method: string; path: string; summary?: string; operationId?: string; deprecated?: boolean; tags?: string[] }> = []
  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, op] of Object.entries(methods ?? {})) {
      if (!op || typeof op !== 'object') continue
      const operation = op as { summary?: string; operationId?: string; deprecated?: boolean; tags?: string[] }
      routes.push({ method: method.toUpperCase(), path, ...operation })
    }
  }

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

function InstancesPanel({ version }: { version: ServiceVersion }) {
  return (
    <table className={s.table}>
      <thead className={s.thead}>
        <tr>
          {['ID', 'Host', 'Port', 'Health', 'Status', 'Last heartbeat'].map(h => <th key={h} className={s.th}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {version.instances.map((inst) => {
          const ago = Math.round((Date.now() - new Date(inst.lastHeartbeatAt).getTime()) / 1000)
          const hc  = inst.lastHealthCheck
          return (
            <tr key={inst.id} className={s.row}>
              <td className={`${s.td} ${s.monoXsMuted}`}>{inst.id.slice(0, 8)}…</td>
              <td className={`${s.td} ${s.mono}`}>{inst.host}</td>
              <td className={`${s.td} ${s.tabularMuted}`}>{inst.port}</td>
              <td className={`${s.td} ${s.tabular}`}>
                {hc
                  ? <span style={{ color: hc.ok ? 'var(--color-success)' : 'var(--color-error)' }}>{hc.ok ? '✓' : '✗'} {hc.statusCode ?? 'timeout'} · {hc.latencyMs}ms</span>
                  : <span className={s.openapiLoading}>pending</span>
                }
              </td>
              <td className={s.td}><Badge variant={STATUS_VARIANT[inst.status]}>{inst.status}</Badge></td>
              <td className={`${s.td} ${s.tabularMuted}`}>{ago}s ago</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

type VersionTab = 'manifest' | 'openapi' | 'instances'

function VersionCard({ version, serviceId }: { version: ServiceVersion; serviceId: string }) {
  const [tab, setTab] = useState<VersionTab>('manifest')
  const tabs: { id: VersionTab; label: string }[] = [
    { id: 'manifest',  label: 'Manifest' },
    { id: 'openapi',   label: 'OpenAPI' },
    { id: 'instances', label: `Instances (${version.instanceCount})` },
  ]
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <div className={s.versionHeader}>
        <span className={s.versionName}>v{version.version}</span>
        <span className={s.versionCount}>{version.instanceCount} instance{version.instanceCount !== 1 ? 's' : ''}</span>
      </div>
      <div className={s.versionTabBar}>
        {tabs.map(t => (
          <button key={t.id} className={s.versionTabBtn} data-active={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className={s.versionBody}>
        {tab === 'manifest'  && <ManifestPanel version={version} />}
        {tab === 'openapi'   && <OpenApiPanel serviceId={serviceId} version={version.version} />}
        {tab === 'instances' && <InstancesPanel version={version} />}
      </div>
    </Card>
  )
}

type PageTab = 'overview' | 'routing-rules'

const PAGE_TABS: { id: PageTab; label: string }[] = [
  { id: 'overview',      label: 'Overview' },
  { id: 'routing-rules', label: 'Routing Rules' },
]

export function ServiceDetailPage({ serviceId }: { serviceId: string }) {
  const [pageTab, setPageTab] = useState<PageTab>('overview')

  const { data, isLoading, isError } = useQuery({
    queryKey: registryKeys.versions(serviceId),
    queryFn:  () => registryApi.getServiceVersions(serviceId),
    refetchInterval: 10_000,
    staleTime: 5_000,
  })

  const title = data?.serviceName ?? serviceId

  return (
    <>
      <Header
        title={title}
        subtitle={
          <span className={s.breadcrumb}>
            <Link to="/services" className={s.breadcrumbLink}>Services</Link>
            <span className={s.breadcrumbSep}>›</span>
            <span className={s.breadcrumbCurrent}>{title}</span>
          </span>
        }
      />

      <div className={s.tabBar}>
        {PAGE_TABS.map(t => (
          <button key={t.id} className={s.tabBtn} data-active={pageTab === t.id} onClick={() => setPageTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {pageTab === 'overview' && (
        <main className={s.main}>
          {isError && <Card className={`${s.stateCard} ${s.errorCard}`}>⚠️ Could not load service</Card>}
          {isLoading && <Card className={`${s.stateCard} ${s.loadingCard}`}>Loading…</Card>}
          {!isLoading && !isError && (data?.versions.length ?? 0) === 0 && (
            <Card className={s.emptyCard}>No instances registered — no versions to show.</Card>
          )}
          {data?.versions.map(v => <VersionCard key={v.version} version={v} serviceId={serviceId} />)}
        </main>
      )}

      {pageTab === 'routing-rules' && <RoutingRulesPage serviceId={serviceId} />}
    </>
  )
}
