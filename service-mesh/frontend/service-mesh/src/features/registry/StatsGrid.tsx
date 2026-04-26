import { Activity, Server, Cpu, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardValue } from '@/components/ui/card'
import type { RegistryStats } from './useRegistryStats'

interface StatsGridProps {
  stats: RegistryStats
  isLoading: boolean
}

export function StatsGrid({ stats, isLoading }: StatsGridProps) {
  const val = (n: number) => isLoading ? '—' : n

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: 'var(--space-4)',
    }}>
      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
          <Server size={16} style={{ color: 'var(--color-text-faint)' }} />
        </CardHeader>
        <CardValue>{val(stats.totalServices)}</CardValue>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', marginTop: 'var(--space-1)' }}>registered</p>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instances</CardTitle>
          <Cpu size={16} style={{ color: 'var(--color-text-faint)' }} />
        </CardHeader>
        <CardValue>{val(stats.totalInstances)}</CardValue>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', marginTop: 'var(--space-1)' }}>total</p>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Healthy</CardTitle>
          <Activity size={16} style={{ color: 'var(--color-success)' }} />
        </CardHeader>
        <CardValue style={{ color: 'var(--color-success)' }}>{val(stats.passingInstances)}</CardValue>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', marginTop: 'var(--space-1)' }}>passing</p>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Degraded</CardTitle>
          <AlertTriangle
            size={16}
            style={{ color: stats.criticalInstances ? 'var(--color-error)' : 'var(--color-text-faint)' }}
          />
        </CardHeader>
        <CardValue style={{
          color: stats.criticalInstances
            ? 'var(--color-error)'
            : stats.degradedInstances ? 'var(--color-warning)' : undefined,
        }}>
          {val(stats.degradedInstances)}
        </CardValue>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', marginTop: 'var(--space-1)' }}>
          {stats.criticalInstances > 0 ? `${stats.criticalInstances} critical` : 'warning or critical'}
        </p>
      </Card>
    </div>
  )
}
