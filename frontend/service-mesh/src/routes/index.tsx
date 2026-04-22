import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader, CardTitle, CardValue } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Server, GitBranch, Cpu } from 'lucide-react'

export const Route = createFileRoute('/')({ component: DashboardPage })

// Mock данные — потом заменим на TanStack Query
const STATS = [
  { label: 'Services',       value: '12',   icon: Server,    trend: '+2 today' },
  { label: 'Active Nodes',   value: '8',    icon: Cpu,       trend: 'all healthy' },
  { label: 'Routes',         value: '34',   icon: GitBranch, trend: '3 pending' },
  { label: 'Req / sec',      value: '2.4k', icon: Activity,  trend: 'avg 5min' },
]

const SERVICES: Array<{ name: string; instances: number; status: 'passing' | 'warning' | 'critical'; version: string }> = [
  { name: 'api-gateway',      instances: 3, status: 'passing',  version: 'v2.4.1' },
  { name: 'auth-service',     instances: 2, status: 'passing',  version: 'v1.9.0' },
  { name: 'user-service',     instances: 2, status: 'warning',  version: 'v3.1.2' },
  { name: 'billing-service',  instances: 1, status: 'passing',  version: 'v1.2.0' },
  { name: 'notification-svc', instances: 1, status: 'critical', version: 'v0.8.3' },
]

const STATUS_VARIANT = {
  passing:  'success',
  warning:  'warning',
  critical: 'error',
} as const

export function DashboardPage() {
  return (
    <>
      <Header title="Dashboard" subtitle="Control Plane Overview" />
      <main style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          {STATS.map(({ label, value, icon: Icon, trend }) => (
            <Card key={label}>
              <CardHeader>
                <CardTitle>{label}</CardTitle>
                <Icon size={16} style={{ color: 'var(--color-text-faint)' }} />
              </CardHeader>
              <CardValue>{value}</CardValue>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', marginTop: 'var(--space-1)' }}>{trend}</p>
            </Card>
          ))}
        </div>

        {/* Services table */}
        <Card style={{ padding: 0 }}>
          <div style={{ padding: 'var(--space-4) var(--space-4) var(--space-3)', borderBottom: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Services</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Name', 'Instances', 'Version', 'Status'].map((h) => (
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
              {SERVICES.map((svc, i) => (
                <tr
                  key={svc.name}
                  style={{
                    borderBottom: i < SERVICES.length - 1 ? '1px solid var(--color-divider)' : 'none',
                  }}
                >
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace', fontSize: 'var(--text-sm)' }}>
                    {svc.name}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {svc.instances}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-muted)', fontFamily: 'monospace', fontSize: 'var(--text-xs)' }}>
                    {svc.version}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <Badge variant={STATUS_VARIANT[svc.status]}>{svc.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

      </main>
    </>
  )
}
