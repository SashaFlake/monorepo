import { Activity, Server, Cpu, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardValue, Tooltip } from '@/shared/ui'
import type { RegistryStats } from '../../domain/types'
import s from './StatsGrid.module.css'
import { ReactElement } from 'react'

interface StatsGridProps {
  stats: RegistryStats
  isLoading: boolean
}

export function StatsGrid({ stats, isLoading }: StatsGridProps): ReactElement {
  const val = (n: number): number | string => isLoading ? '—' : n

  return (
    <div className={s.grid}>
      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
          <Tooltip content="Total registered services" side="top">
            <Server size={16} style={{ color: 'var(--color-text-faint)' }} />
          </Tooltip>
        </CardHeader>
        <CardValue>{val(stats.totalServices)}</CardValue>
        <p className={s.hint}>registered</p>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instances</CardTitle>
          <Tooltip content="Total service instances across all versions" side="top">
            <Cpu size={16} style={{ color: 'var(--color-text-faint)' }} />
          </Tooltip>
        </CardHeader>
        <CardValue>{val(stats.totalInstances)}</CardValue>
        <p className={s.hint}>total</p>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Healthy</CardTitle>
          <Tooltip content="Instances passing health checks" side="top">
            <Activity size={16} style={{ color: 'var(--color-success)' }} />
          </Tooltip>
        </CardHeader>
        <CardValue style={{ color: 'var(--color-success)' }}>
          {val(stats.passingInstances)}
        </CardValue>
        <p className={s.hint}>passing</p>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Degraded</CardTitle>
          <Tooltip
            content={
              stats.criticalInstances > 0
                ? `${stats.criticalInstances} critical, ${stats.degradedInstances} total`
                : 'Instances in warning or critical state'
            }
            side="top"
          >
            <AlertTriangle
              size={16}
              style={{ color: stats.criticalInstances ? 'var(--color-error)' : 'var(--color-text-faint)' }}
            />
          </Tooltip>
        </CardHeader>
        <CardValue style={{
          color: stats.criticalInstances
            ? 'var(--color-error)'
            : stats.degradedInstances ? 'var(--color-warning)' : undefined,
        }}>
          {val(stats.degradedInstances)}
        </CardValue>
        <p className={s.hint}>
          {stats.criticalInstances > 0 ? `${stats.criticalInstances} critical` : 'warning or critical'}
        </p>
      </Card>
    </div>
  )
}
