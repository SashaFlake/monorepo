import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorCard } from '@/components/ui/ErrorCard'
import { registryApi, registryKeys } from './api/api'
import type { InstanceStatus } from './api/types'
import s from './ServicesPage.module.css'
import {ReactElement} from "react";

const STATUS_VARIANT: Record<InstanceStatus, 'success' | 'warning' | 'error'> = {
  passing:  'success',
  warning:  'warning',
  critical: 'error',
}

export function ServicesPage(): ReactElement {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useQuery({
    queryKey: registryKeys.list(),
    queryFn:  registryApi.listServices,
    refetchInterval: 10_000,
    staleTime: 5_000,
  })

  const services = data ?? []

  return (
    <>
      <Header title="Services" subtitle="Registered services & instances" />
      <main className={s.main}>
        {isError && <ErrorCard message="Cannot reach registry backend" />}
        {isLoading && (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <table className={s.table}>
              <thead className={s.thead}>
                <tr>
                  <th className={s.th}>Name</th>
                  <th className={s.th}>Labels</th>
                  <th className={`${s.th} ${s.thRight}`}>Instances</th>
                  <th className={`${s.th} ${s.thRight}`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className={s.row}>
                    <td className={`${s.td} ${s.nameCell}`}><Skeleton width="60%" /></td>
                    <td className={s.td}><Skeleton width="80%" /></td>
                    <td className={`${s.td} ${s.tdRight}`}><Skeleton width="40px" /></td>
                    <td className={`${s.td} ${s.thRight}`}><Skeleton width="60px" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {!isLoading && !isError && services.length === 0 && (
          <Card><div className={s.empty}>No services registered yet.</div></Card>
        )}

        {!isLoading && !isError && services.length > 0 && (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <table className={s.table}>
              <thead className={s.thead}>
                <tr>
                  <th className={s.th}>Name</th>
                  <th className={s.th}>Labels</th>
                  <th className={`${s.th} ${s.thRight}`}>Instances</th>
                  <th className={`${s.th} ${s.thRight}`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {services.map((svc) => (
                  <tr
                    key={svc.id}
                    className={s.row}
                    onClick={() => {
                      void navigate({ to: '/services/$serviceId', params: { serviceId: svc.id } })
                    }}
                  >
                    <td className={`${s.td} ${s.nameCell}`}>{svc.name}</td>
                    <td className={s.td}>
                      <div className={s.labelsCell}>
                        {Object.entries(svc.labels).map(([k, v]) => (
                          <span key={k} className={s.label}>{k}={v}</span>
                        ))}
                      </div>
                    </td>
                    <td className={`${s.td} ${s.tdRight}`}>{svc.instances.length}</td>
                    <td className={`${s.td} ${s.thRight}`}>
                      <Badge variant={STATUS_VARIANT[svc.worstStatus]}>{svc.worstStatus}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </main>
    </>
  )
}
