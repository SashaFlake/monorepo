import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { registryApi, registryKeys, type InstanceStatus } from '@/lib/api'

export const Route = createFileRoute('/services')({ component: ServicesPage })

const STATUS_VARIANT: Record<InstanceStatus, 'success' | 'warning' | 'error'> = {
  passing:  'success',
  warning:  'warning',
  critical: 'error',
}

const tdStyle = {
  padding: 'var(--space-3) var(--space-4)',
  fontSize: 'var(--text-sm)',
}

export function ServicesPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: registryKeys.list(),
    queryFn:  registryApi.listServices,
    refetchInterval: 10_000,
    staleTime: 5_000,
  })

  const entries = data ? Object.entries(data) : []

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

        {!isLoading && !isError && entries.length === 0 && (
          <Card style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-faint)', fontSize: 'var(--text-sm)' }}>
            No services registered yet.<br />
            <code style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-2)', display: 'block' }}>
              POST /api/v1/services
            </code>
          </Card>
        )}

        {entries.map(([serviceName, instances]) => (
          <Card key={serviceName} style={{ padding: 0 }}>
            <div style={{
              padding: 'var(--space-3) var(--space-4)',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
            }}>
              <span style={{ fontFamily: 'monospace', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                {serviceName}
              </span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>
                {instances.length} instance{instances.length !== 1 ? 's' : ''}
              </span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['ID', 'Host', 'Port', 'Status', 'Last heartbeat'].map(h => (
                    <th key={h} style={{
                      ...tdStyle,
                      color: 'var(--color-text-muted)',
                      fontWeight: 500,
                      fontSize: 'var(--text-xs)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {instances.map((inst, i) => {
                  const ago = Math.round((Date.now() - new Date(inst.lastHeartbeatAt).getTime()) / 1000)
                  return (
                    <tr key={inst.id} style={{ borderBottom: i < instances.length - 1 ? '1px solid var(--color-divider)' : 'none' }}>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                        {inst.id.slice(0, 8)}…
                      </td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{inst.host}</td>
                      <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-muted)' }}>{inst.port}</td>
                      <td style={tdStyle}>
                        <Badge variant={STATUS_VARIANT[inst.status]}>{inst.status}</Badge>
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                        {ago}s ago
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
        ))}
      </main>
    </>
  )
}
