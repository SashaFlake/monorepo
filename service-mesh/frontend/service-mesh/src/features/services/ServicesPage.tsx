import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { registryApi, registryKeys, type InstanceStatus } from '@/lib/api'

const STATUS_VARIANT: Record<InstanceStatus, 'success' | 'warning' | 'error'> = {
  passing:  'success',
  warning:  'warning',
  critical: 'error',
}

const th: React.CSSProperties = {
  padding: 'var(--space-3) var(--space-4)',
  color: 'var(--color-text-muted)',
  fontWeight: 500,
  fontSize: 'var(--text-xs)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  textAlign: 'left',
}

const td: React.CSSProperties = {
  padding: 'var(--space-3) var(--space-4)',
  fontSize: 'var(--text-sm)',
}

export function ServicesPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useQuery({
    queryKey: registryKeys.list(),
    queryFn:  registryApi.listServices,
    refetchInterval: 10_000,
    staleTime: 5_000,
  })

  const services = data ?? []

  return (
    <>
      <Header title="Services" subtitle="Registered services & instances" />
      <main style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

        {isError && (
          <Card style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)' }}>
            ⚠️ Cannot reach registry backend
          </Card>
        )}

        {isLoading && (
          <Card style={{ color: 'var(--color-text-faint)', fontSize: 'var(--text-sm)' }}>Loading…</Card>
        )}

        {!isLoading && !isError && services.length === 0 && (
          <Card style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-faint)', fontSize: 'var(--text-sm)' }}>
            No services registered yet.
          </Card>
        )}

        {!isLoading && !isError && services.length > 0 && (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={th}>Name</th>
                  <th style={th}>Labels</th>
                  <th style={{ ...th, textAlign: 'right' }}>Instances</th>
                  <th style={{ ...th, textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {services.map((svc, i) => (
                  <tr
                    key={svc.id}
                    onClick={() => navigate({ to: '/services/$serviceId', params: { serviceId: svc.id } })}
                    style={{
                      borderBottom: i < services.length - 1 ? '1px solid var(--color-divider)' : 'none',
                      cursor: 'pointer',
                      transition: 'background var(--transition-interactive)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-offset)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <td style={{ ...td, fontFamily: 'monospace', fontWeight: 600 }}>{svc.name}</td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                        {Object.entries(svc.labels).map(([k, v]) => (
                          <span key={k} style={{ fontSize: 'var(--text-xs)', fontFamily: 'monospace', background: 'var(--color-surface-offset)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-muted)' }}>{k}={v}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ ...td, textAlign: 'right', color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>{svc.instances.length}</td>
                    <td style={{ ...td, textAlign: 'right' }}><Badge variant={STATUS_VARIANT[svc.worstStatus]}>{svc.worstStatus}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </main>
    </>
  )
}
