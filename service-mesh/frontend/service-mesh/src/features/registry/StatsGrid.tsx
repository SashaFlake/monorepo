import { Activity, Server, Cpu, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardValue } from '@/components/ui/card'
import type { RegistryStats } from './useRegistryStats'
import s from './StatsGrid.module.css'
import {ReactElement} from "react";

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
          <Server size={16} style={{ color: 'var(--color-text-faint)' }} />
        </CardHeader>
        <CardValue>{val(stats.totalServices)}</CardValue>
        <p className={s.hint}>registered</p>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instances</CardTitle>
          <Cpu size={16} style={{ color: 'var(--color-text-faint)' }} />
        </CardHeader>
        <CardValue>{val(stats.totalInstances)}</CardValue>
        <p className={s.hint}>total</p>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Healthy</CardTitle>
          <Activity size={16} style={{ color: 'var(--color-success)' }} />
        </CardHeader>
        <CardValue style={{ color: 'var(--color-success)' }}>
          {val(stats.passingInstances)}
        </CardValue>
        <p className={s.hint}>passing</p>
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
        <p className={s.hint}>
          {stats.criticalInstances > 0 ? `${stats.criticalInstances} critical` : 'warning or critical'}
        </p>
      </Card>
    </div>
  )
}
