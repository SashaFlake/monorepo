import { ReactElement } from 'react'
import { Badge } from '@/components/ui/badge'
import type { ServiceVersion, InstanceStatus } from '../api/types'
import s from '../ServiceDetailPage.module.css'

const STATUS_VARIANT: Record<InstanceStatus, 'success' | 'warning' | 'error'> = {
  passing:  'success',
  warning:  'warning',
  critical: 'error',
}

export function InstancesPanel({ version }: { version: ServiceVersion }): ReactElement {
  return (
    <table className={s.table}>
      <thead className={s.thead}>
        <tr>
          {['ID', 'Host', 'Port', 'Health', 'Status', 'Last heartbeat'].map(h => <th key={h} className={s.th}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {version.instances.map((inst) => {
          const ago = Math.round((Date.now() - new Date(inst.lastHeartbeatAt).getTime()) / 1000)
          const hc  = inst.lastHealthCheck
          return (
            <tr key={inst.id} className={s.row}>
              <td className={`${s.td} ${s.monoXsMuted}`}>{inst.id.slice(0, 8)}…</td>
              <td className={`${s.td} ${s.mono}`}>{inst.host}</td>
              <td className={`${s.td} ${s.tabularMuted}`}>{inst.port}</td>
              <td className={`${s.td} ${s.tabular}`}>
                {hc
                  ? <span style={{ color: hc.ok ? 'var(--color-success)' : 'var(--color-error)' }}>{hc.ok ? '✓' : '✗'} {hc.statusCode ?? 'timeout'} · {hc.latencyMs}ms</span>
                  : <span className={s.openapiLoading}>pending</span>
                }
              </td>
              <td className={s.td}><Badge variant={STATUS_VARIANT[inst.status]}>{inst.status}</Badge></td>
              <td className={`${s.td} ${s.tabularMuted}`}>{ago}s ago</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
