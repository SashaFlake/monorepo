import { ReactElement } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Header } from '@/components/layout/Header'
import { Card, ErrorCard, Skeleton } from '@/shared/ui'
import { ServicesTable } from '@/features/registry'
import { useServices } from '../../application/useServices.application'
import s from './ServicesPage.module.css'

/**
 * Page listing all registered services in the mesh.
 *
 * Shows a skeleton table while loading, an error card on failure, and a
 * clickable table that navigates to the selected service's detail page.
 *
 * @returns The services page element
 * @sideEffects Calls {@link useServices} (TanStack Query subscription) and
 *              {@link useNavigate} (router navigation on row click).
 */
export function ServicesPage(): ReactElement {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useServices()

  const services = data ?? []

  return (
    <>
      <Header title="Services" subtitle="Registered services & instances" />
      <main className={s.main}>
        {isError && <ErrorCard message="Cannot reach registry backend" />}

        {isLoading && (
          <Card className={s.cardFlush}>
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
          <Card className={s.cardFlush}>
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
