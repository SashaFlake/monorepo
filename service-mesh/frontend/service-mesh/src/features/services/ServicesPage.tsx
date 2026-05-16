import { ReactElement } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/Header'
import { Card, ErrorCard, Skeleton } from '@/shared/ui'
import { registryApi, registryKeys } from './api/api'
import { ServicesTable } from './components/ServicesTable/ServicesTable'
import s from './ServicesPage.module.css'

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
            <ServicesTable
              services={services}
              onRowClick={(svc) => {
                void navigate({ to: '/services/$serviceId', params: { serviceId: svc.id } })
              }}
            />
          </Card>
        )}
      </main>
    </>
  )
}
