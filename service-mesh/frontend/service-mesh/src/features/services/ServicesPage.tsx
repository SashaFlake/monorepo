import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { registryApi, registryKeys } from './api/api'
import type { InstanceStatus } from './api/types'
import s from './ServicesPage.module.css'

const STATUS_VARIANT: Record<InstanceStatus, 'success' | 'warning' | 'error'> = {
  passing:  'success',
  warning:  'warning',
  critical: 'error',
}

export function ServicesPage(): JSX.Element {
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
        {isError && <Card className={`${s.stateCard} ${s.errorCard}`}>⚠️ Cannot reach registry backend</Card>}
        {isLoading && <Card className={`${s.stateCard} ${s.loadingCard}`}>Loading…</Card>}

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
