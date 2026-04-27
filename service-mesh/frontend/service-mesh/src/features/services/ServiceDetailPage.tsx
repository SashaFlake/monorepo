import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RoutingRulesPage } from '@/features/routing-rules/RoutingRulesPage'
import { registryApi, registryKeys, type InstanceStatus, type ServiceVersion, type OpenApiDoc } from '@/lib/api'

const STATUS_VARIANT: Record<InstanceStatus, 'success' | 'warning' | 'error'> = {
  passing:  'success',
  warning:  'warning',
  critical: 'error',
}

const HTTP_METHOD_COLOR: Record<string, string> = {
  get:    'var(--color-success)',
  post:   'var(--color-primary)',
  put:    'var(--color-warning)',
  patch:  'var(--color-orange)',
  delete: 'var(--color-error)',
  head:   'var(--color-text-muted)',
  options:'var(--color-text-muted)',
}

const tdStyle: React.CSSProperties = {
  padding: 'var(--space-3) var(--space-4)',
  fontSize: 'var(--text-sm)',
}

const thStyle: React.CSSProperties = {
  ...tdStyle,
  color: 'var(--color-text-muted)',
  fontWeight: 500,
  fontSize: 'var(--text-xs)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  textAlign: 'left',
}

function ManifestPanel({ version }: { version: ServiceVersion }) {
  const m = version.manifest
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'monospace', color: 'var(--color-text-muted)', background: 'var(--color-surface-offset)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>{m.apiVersion}</span>
        <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'monospace', color: 'var(--color-primary)', background: 'var(--color-primary-highlight)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>{m.kind}</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', marginLeft: 'auto' }}>generated {new Date(m.metadata.generatedAt).toLocaleTimeString()}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
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
    <div style={{ background: 'var(--color-surface-offset)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>{children}</div>
    </div>
  )
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
      <span style={{ color: 'var(--color-text-faint)', minWidth: 80 }}>{k}</span>
      <span style={{ fontFamily: 'monospace', color: 'var(--color-text)' }}>{v}</span>
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

  if (isLoading) return <div style={{ color: 'var(--color-text-faint)', fontSize: 'var(--text-sm)', padding: 'var(--space-4)' }}>Fetching OpenAPI from instance…</div>
  if (isError) return (
    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-error)', background: 'var(--color-error-highlight)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
      <div style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>Could not fetch OpenAPI</div>
      <div style={{ color: 'var(--color-text-muted)', fontFamily: 'monospace', fontSize: 'var(--text-xs)' }}>{(error as Error).message}</div>
      <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>Make sure the instance exposes <code>/openapi.json</code></div>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {doc?.info && (
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'baseline', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{doc.info.title}</span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>v{doc.info.version}</span>
          {doc.info.description && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>{doc.info.description}</span>}
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', marginLeft: 'auto' }}>OpenAPI {doc.openapi}</span>
        </div>
      )}
      {routes.length === 0 ? (
        <div style={{ color: 'var(--color-text-faint)', fontSize: 'var(--text-sm)' }}>No paths defined in spec.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['Method', 'Path', 'Summary', 'Tags'].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {routes.map((r, i) => (
              <tr key={`${r.method}-${r.path}`} style={{ borderBottom: i < routes.length - 1 ? '1px solid var(--color-divider)' : 'none', opacity: r.deprecated ? 0.5 : 1 }}>
                <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)', fontWeight: 700, color: HTTP_METHOD_COLOR[r.method.toLowerCase()] ?? 'var(--color-text)', background: 'var(--color-surface-offset)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>{r.method}</span></td>
                <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{r.path}{r.deprecated && <span style={{ color: 'var(--color-warning)', marginLeft: 4 }}>deprecated</span>}</td>
                <td style={{ ...tdStyle, color: 'var(--color-text-muted)' }}>{r.summary ?? '—'}</td>
                <td style={tdStyle}><div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>{(r.tags ?? []).map(t => <span key={t} style={{ fontSize: 'var(--text-xs)', fontFamily: 'monospace', background: 'var(--color-surface-offset)', padding: '1px 6px', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-muted)' }}>{t}</span>)}</div></td>
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
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
          {['ID', 'Host', 'Port', 'Health', 'Status', 'Last heartbeat'].map(h => <th key={h} style={thStyle}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {version.instances.map((inst, i) => {
          const ago = Math.round((Date.now() - new Date(inst.lastHeartbeatAt).getTime()) / 1000)
          const hc  = inst.lastHealthCheck
          return (
            <tr key={inst.id} style={{ borderBottom: i < version.instances.length - 1 ? '1px solid var(--color-divider)' : 'none' }}>
              <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{inst.id.slice(0, 8)}…</td>
              <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{inst.host}</td>
              <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-muted)' }}>{inst.port}</td>
              <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-muted)' }}>
                {hc ? <span style={{ color: hc.ok ? 'var(--color-success)' : 'var(--color-error)' }}>{hc.ok ? '✓' : '✗'} {hc.statusCode ?? 'timeout'} · {hc.latencyMs}ms</span> : <span style={{ color: 'var(--color-text-faint)' }}>pending</span>}
              </td>
              <td style={tdStyle}><Badge variant={STATUS_VARIANT[inst.status]}>{inst.status}</Badge></td>
              <td style={{ ...tdStyle, color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>{ago}s ago</td>
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
      <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <span style={{ fontFamily: 'monospace', fontSize: 'var(--text-sm)', fontWeight: 700 }}>v{version.version}</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{version.instanceCount} instance{version.instanceCount !== 1 ? 's' : ''}</span>
      </div>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-sm)', color: tab === t.id ? 'var(--color-text)' : 'var(--color-text-muted)', borderBottom: tab === t.id ? '2px solid var(--color-primary)' : '2px solid transparent', background: 'none', border: 'none', borderRadius: 0, cursor: 'pointer', transition: 'color var(--transition-interactive)', fontWeight: tab === t.id ? 600 : 400 }}>{t.label}</button>
        ))}
      </div>
      <div style={{ padding: 'var(--space-4)' }}>
        {tab === 'manifest'  && <ManifestPanel version={version} />}
        {tab === 'openapi'   && <OpenApiPanel serviceId={serviceId} version={version.version} />}
        {tab === 'instances' && <InstancesPanel version={version} />}
      </div>
    </Card>
  )
}

// ── Page-level tabs ──────────────────────────────────────────────────────────

type PageTab = 'overview' | 'routing-rules'

const PAGE_TABS: { id: PageTab; label: string }[] = [
  { id: 'overview',      label: 'Overview' },
  { id: 'routing-rules', label: 'Routing Rules' },
]

const tabBarStyle: React.CSSProperties = {
  display: 'flex',
  borderBottom: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  paddingInline: 'var(--space-6)',
}

function pageTabBtn(active: boolean): React.CSSProperties {
  return {
    padding: 'var(--space-3) var(--space-4)',
    fontSize: 'var(--text-sm)',
    fontWeight: active ? 600 : 400,
    color: active ? 'var(--color-text)' : 'var(--color-text-muted)',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
    borderRadius: 0,
    cursor: 'pointer',
    transition: 'color var(--transition-interactive)',
    marginBottom: '-1px',
  }
}

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
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Link to="/services" style={{ color: 'var(--color-text-faint)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}>Services</Link>
            <span style={{ color: 'var(--color-text-faint)' }}>›</span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{title}</span>
          </span>
        }
      />

      {/* Page-level tab bar */}
      <div style={tabBarStyle}>
        {PAGE_TABS.map(t => (
          <button key={t.id} style={pageTabBtn(pageTab === t.id)} onClick={() => setPageTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {pageTab === 'overview' && (
        <main style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {isError && <Card style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)' }}>⚠️ Could not load service</Card>}
          {isLoading && <Card style={{ color: 'var(--color-text-faint)', fontSize: 'var(--text-sm)' }}>Loading…</Card>}
          {!isLoading && !isError && (data?.versions.length ?? 0) === 0 && (
            <Card style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-faint)', fontSize: 'var(--text-sm)' }}>No instances registered — no versions to show.</Card>
          )}
          {data?.versions.map(v => <VersionCard key={v.version} version={v} serviceId={serviceId} />)}
        </main>
      )}

      {/* Routing Rules tab */}
      {pageTab === 'routing-rules' && (
        <RoutingRulesPage serviceId={serviceId} />
      )}
    </>
  )
}
