import { ReactElement } from 'react'
import { Badge } from '@/shared/ui'
import type { ServiceVersion } from '../../domain/services.types'
import { STATUS_VARIANT } from './ServiceDetailPage'
import s from './ServiceDetailPage.module.css'

/**
 * Formats how many seconds have passed since a heartbeat timestamp.
 *
 * @param lastHeartbeatAt – ISO timestamp of the last heartbeat
 * @param now             – current timestamp in milliseconds
 * @returns Human-readable string like "42s ago"
 * @sideEffects none
 */
const formatAgo = (lastHeartbeatAt: string, now: number): string => {
  const seconds = Math.round((now - new Date(lastHeartbeatAt).getTime()) / 1000)
  return `${seconds}s ago`
}

/**
 * Table of service instances with health check and heartbeat info.
 *
 * @param version – service version containing the instance list
 * @returns InstancesPanel React element
 * @sideEffects Calls `Date.now()` once per render to compute relative time.
 */
export function InstancesPanel({ version }: { version: ServiceVersion }): ReactElement {
  const now = Date.now()

  return (
    <table className={s.table}>
      <thead className={s.thead}>
        <tr>
          {['ID', 'Host', 'Port', 'Health', 'Status', 'Last heartbeat'].map(h => <th key={h} className={s.th}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {version.instances.map((inst) => {
          const ago = formatAgo(inst.lastHeartbeatAt, now)
          const hc  = inst.lastHealthCheck
          return (
            <tr key={inst.id} className={s.row}>
              <td className={`${s.td} ${s.monoXsMuted}`}>{inst.id.slice(0, 8)}…</td>
              <td className={`${s.td} ${s.mono}`}>{inst.host}</td>
              <td className={`${s.td} ${s.tabularMuted}`}>{inst.port}</td>
              <td className={`${s.td} ${s.tabular}`}>
                {hc
                  ? <span className={hc.ok ? s.healthOk : s.healthFail}>{hc.ok ? '✓' : '✗'} {hc.statusCode ?? 'timeout'} · {hc.latencyMs}ms</span>
                  : <span className={s.openapiLoading}>pending</span>
                }
              </td>
              <td className={s.td}><Badge variant={STATUS_VARIANT[inst.status]}>{inst.status}</Badge></td>
              <td className={`${s.td} ${s.tabularMuted}`}>{ago}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
