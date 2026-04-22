import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Activity, Server, Cpu, AlertTriangle } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader, CardTitle, CardValue } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { registryApi, registryKeys, type ServicesMap, type InstanceStatus } from '@/lib/api'

export const Route = createFileRoute('/')({ component: DashboardPage })

const STATUS_VARIANT: Record<InstanceStatus, 'success' | 'warning' | 'error'> = {
  passing:  'success',
  warning:  'warning',
  critical: 'error',
}

// Агрегация статуса сервиса: worst-case по инстансам.
// Пустой массив = нет живых инстансов → critical.
function worstStatus(statuses: InstanceStatus[]): InstanceStatus {
  if (statuses.length === 0)         return 'critical'
  if (statuses.includes('critical')) return 'critical'
  if (statuses.includes('warning'))  return 'warning'
  return 'passing'
}

function deriveStats(data: ServicesMap) {
  const services  = Object.keys(data)
  const instances = Object.values(data).flat()
  const passing   = instances.filter(i => i.status === 'passing').length
  const warning   = instances.filter(i => i.status === 'warning').length
  const critical  = instances.filter(i => i.status === 'critical').length
  return { services, instances, passing, warning, critical }
}

export function DashboardPage() {
  const { data, isLoading, isError, dataUpdatedAt } = useQuery({
    queryKey: registryKeys.list(),
    queryFn:  registryApi.listServices,
    refetchInterval: 10_000,
    staleTime: 5_000,
  })

  const stats = data ? deriveStats(data) : null

  const updatedAt = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString()
    : null

  return (
    <>
      <Header
        title="Dashboard"
        subtitle={updatedAt ? `Updated ${updatedAt}` : 'Control Plane Overview'}
      />
      <main style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
          <Card>
            <CardHeader>
              <CardTitle>Services</CardTitle>
              <Server size={16} style={{ color: 'var(--color-text-faint)' }} />
            </CardHeader>
            <CardValue>{isLoading ? '—' : (stats?.services.length ?? 0)}</CardValue>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', marginTop: 'var(--space-1)' }}>registered</p>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Instances</CardTitle>
              <Cpu size={16} style={{ color: 'var(--color-text-faint)' }} />
            </CardHeader>
            <CardValue>{isLoading ? '—' : (stats?.instances.length ?? 0)}</CardValue>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', marginTop: 'var(--space-1)' }}>total</p>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Healthy</CardTitle>
              <Activity size={16} style={{ color: 'var(--color-success)' }} />
            </CardHeader>
            <CardValue style={{ color: 'var(--color-success)' }}>
              {isLoading ? '—' : (stats?.passing ?? 0)}
            </CardValue>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', marginTop: 'var(--space-1)' }}>passing</p>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Degraded</CardTitle>
              <AlertTriangle size={16} style={{ color: stats?.critical ? 'var(--color-error)' : 'var(--color-text-faint)' }} />
            </CardHeader>
            <CardValue style={{ color: stats?.critical ? 'var(--color-error)' : stats?.warning ? 'var(--color-warning)' : undefined }}>
              {isLoading ? '—' : ((stats?.critical ?? 0) + (stats?.warning ?? 0))}
            </CardValue>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', marginTop: 'var(--space-1)' }}>
              {(stats?.critical ?? 0) > 0 ? `${stats!.critical} critical` : 'warning or critical'}
            </p>
          </Card>
        </div>

        {/* Error state */}
        {isError && (
          <Card style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)', fontSize: 'var(--text-sm)' }}>
            ⚠️ Cannot reach registry — is the backend running?
          </Card>
        )}

        {/* Services table */}
        <Card style={{ padding: 0 }}>
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Services</h2>
            {isLoading && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>loading…</span>}
          </div>

          {!isLoading && !isError && (!data || Object.keys(data).length === 0) ? (
            <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-faint)', fontSize: 'var(--text-sm)' }}>
              No services registered yet.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Name', 'Instances', 'Status'].map(h => (
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
                {data && Object.entries(data).map(([name, instances], i, arr) => {
                  const status = worstStatus(instances.map(i => i.status))
                  return (
                    <tr key={name} style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--color-divider)' : 'none' }}>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace', fontSize: 'var(--text-sm)' }}>
                        {name}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                        {instances.length}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </Card>

      </main>
    </>
  )
}
