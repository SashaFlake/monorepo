import { useQuery } from '@tanstack/react-query'
import { Activity, Server, Cpu, AlertTriangle } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader, CardTitle, CardValue } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { registryApi, registryKeys, type InstanceStatus } from '@/lib/api'

const STATUS_VARIANT: Record<InstanceStatus, 'success' | 'warning' | 'error'> = {
  passing:  'success',
  warning:  'warning',
  critical: 'error',
}

export function RegistryDashboard() {
  const { data, isLoading, isError, dataUpdatedAt } = useQuery({
    queryKey: registryKeys.list(),
    queryFn:  registryApi.listServices,
    refetchInterval: 10_000,
    staleTime: 5_000,
  })

  const services  = data ?? []
  const instances = services.flatMap(s => s.instances)
  const passing   = instances.filter(i => i.status === 'passing').length
  const degraded  = instances.filter(i => i.status !== 'passing').length
  const critical  = instances.filter(i => i.status === 'critical').length
  const updatedAt = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : null

  return (
    <>
      <Header
        title="Dashboard"
        subtitle={updatedAt ? `Updated ${updatedAt}` : 'Control Plane Overview'}
      />
      <main style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
          <Card>
            <CardHeader><CardTitle>Services</CardTitle><Server size={16} style={{ color: 'var(--color-text-faint)' }} /></CardHeader>
            <CardValue>{isLoading ? '—' : services.length}</CardValue>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', marginTop: 'var(--space-1)' }}>registered</p>
          </Card>

          <Card>
            <CardHeader><CardTitle>Instances</CardTitle><Cpu size={16} style={{ color: 'var(--color-text-faint)' }} /></CardHeader>
            <CardValue>{isLoading ? '—' : instances.length}</CardValue>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', marginTop: 'var(--space-1)' }}>total</p>
          </Card>

          <Card>
            <CardHeader><CardTitle>Healthy</CardTitle><Activity size={16} style={{ color: 'var(--color-success)' }} /></CardHeader>
            <CardValue style={{ color: 'var(--color-success)' }}>{isLoading ? '—' : passing}</CardValue>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', marginTop: 'var(--space-1)' }}>passing</p>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Degraded</CardTitle>
              <AlertTriangle size={16} style={{ color: critical ? 'var(--color-error)' : 'var(--color-text-faint)' }} />
            </CardHeader>
            <CardValue style={{ color: critical ? 'var(--color-error)' : degraded ? 'var(--color-warning)' : undefined }}>
              {isLoading ? '—' : degraded}
            </CardValue>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', marginTop: 'var(--space-1)' }}>
              {critical > 0 ? `${critical} critical` : 'warning or critical'}
            </p>
          </Card>
        </div>

        {isError && (
          <Card style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)', fontSize: 'var(--text-sm)' }}>
            ⚠️ Cannot reach registry — is the backend running?
          </Card>
        )}

        <Card style={{ padding: 0 }}>
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Services</h2>
            {isLoading && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>loading…</span>}
          </div>

          {!isLoading && !isError && services.length === 0 ? (
            <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-faint)', fontSize: 'var(--text-sm)' }}>
              No services registered yet.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Name', 'Labels', 'Instances', 'Status'].map(h => (
                    <th key={h} style={{
                      padding: 'var(--space-2) var(--space-4)',
                      textAlign: 'left',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-muted)',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {services.map((svc, i) => (
                  <tr key={svc.id} style={{ borderBottom: i < services.length - 1 ? '1px solid var(--color-divider)' : 'none' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace', fontSize: 'var(--text-sm)' }}>{svc.name}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                        {Object.entries(svc.labels).map(([k, v]) => (
                          <span key={k} style={{ fontSize: 'var(--text-xs)', fontFamily: 'monospace', background: 'var(--color-surface-offset)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-muted)' }}>{k}={v}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>{svc.instances.length}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}><Badge variant={STATUS_VARIANT[svc.worstStatus]}>{svc.worstStatus}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

      </main>
    </>
  )
}
