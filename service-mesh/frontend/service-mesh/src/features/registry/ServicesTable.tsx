import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ServiceView, InstanceStatus } from '@/features/services/api/types'
import s from './ServicesTable.module.css'
import {ReactElement} from "react";

const STATUS_VARIANT: Record<InstanceStatus, 'success' | 'warning' | 'error'> = {
  passing:  'success',
  warning:  'warning',
  critical: 'error',
}

interface ServicesTableProps {
  services: ServiceView[]
  isLoading: boolean
}

export function ServicesTable({ services, isLoading }: ServicesTableProps): ReactElement {
  return (
    <Card style={{ padding: 0 }}>
      <div className={s.tableHeader}>
        <h2 className={s.tableTitle}>Services</h2>
        {isLoading && <span className={s.loadingHint}>loading…</span>}
      </div>

      {!isLoading && services.length === 0 ? (
        <div className={s.empty}>No services registered yet.</div>
      ) : (
        <table className={s.table}>
          <thead>
            <tr className={s.row}>
              <th className={s.th}>Name</th>
              <th className={s.th}>Labels</th>
              <th className={s.th}>Instances</th>
              <th className={s.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {services.map((svc) => (
              <tr key={svc.id} className={s.row}>
                <td className={`${s.td} ${s.nameCell}`}>{svc.name}</td>
                <td className={s.td}>
                  <div className={s.labelsCell}>
                    {Object.entries(svc.labels).map(([k, v]) => (
                      <span key={k} className={s.label}>{k}={v}</span>
                    ))}
                  </div>
                </td>
                <td className={`${s.td} ${s.countCell}`}>{svc.instances.length}</td>
                <td className={s.td}>
                  <Badge variant={STATUS_VARIANT[svc.worstStatus]}>{svc.worstStatus}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}
