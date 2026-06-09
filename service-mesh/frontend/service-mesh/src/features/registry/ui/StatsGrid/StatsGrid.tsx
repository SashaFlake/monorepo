import { Activity, Server, Cpu, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardValue, Tooltip } from '@/shared/ui'
import type { RegistryStats } from '../../domain/registry.types'
import s from './StatsGrid.module.css'
import { ReactElement } from 'react'

/**
 * Props for {@link StatsGrid}.
 */
interface StatsGridProps {
  /** Aggregated registry statistics. */
  stats: RegistryStats

  /** When `true`, numeric values are replaced with an em dash. */
  isLoading: boolean
}

/**
 * Renders a 4-column grid of registry statistics: services, instances,
 * healthy instances, and degraded/critical instances.
 *
 * Each card includes a tooltip explaining the metric and adapts its colour
 * when critical instances are present.
 *
 * @param stats     - Aggregated statistics from the registry
 * @param isLoading - Whether the underlying query is still loading
 * @returns The stats grid element
 * @sideEffects none
 */
export function StatsGrid({ stats, isLoading }: StatsGridProps): ReactElement {
  const val = (n: number): number | string => isLoading ? '—' : n

  return (
    <div className={s.grid}>
      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
          <Tooltip content="Total registered services" side="top">
            <span className={s.iconFaint}><Server size={16} /></span>
          </Tooltip>
        </CardHeader>
        <CardValue>{val(stats.totalServices)}</CardValue>
        <p className={s.hint}>registered</p>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instances</CardTitle>
          <Tooltip content="Total service instances across all versions" side="top">
            <span className={s.iconFaint}><Cpu size={16} /></span>
          </Tooltip>
        </CardHeader>
        <CardValue>{val(stats.totalInstances)}</CardValue>
        <p className={s.hint}>total</p>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Healthy</CardTitle>
          <Tooltip content="Instances passing health checks" side="top">
            <span className={s.iconSuccess}><Activity size={16} /></span>
          </Tooltip>
        </CardHeader>
        <span className={s.valueSuccess}>
          <CardValue>{val(stats.passingInstances)}</CardValue>
        </span>
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
            <span className={stats.criticalInstances ? s.iconError : s.iconFaint}>
              <AlertTriangle size={16} />
            </span>
          </Tooltip>
        </CardHeader>
        <span className={
          stats.criticalInstances
            ? s.valueError
            : stats.degradedInstances ? s.valueWarning : ''
        }>
          <CardValue>{val(stats.degradedInstances)}</CardValue>
        </span>
        <p className={s.hint}>
          {stats.criticalInstances > 0 ? `${stats.criticalInstances} critical` : 'warning or critical'}
        </p>
      </Card>
    </div>
  )
}
